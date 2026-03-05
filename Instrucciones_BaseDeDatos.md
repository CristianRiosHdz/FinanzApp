# Configuración de Base de Datos (Supabase)

Para que FinanzApp guarde los datos en la nube y puedas acceder desde cualquier dispositivo, hemos preparado la aplicación para integrarse con Supabase (una alternativa moderna a Firebase basada en PostgreSQL).

Sigue estos pasos para finalizar la configuración de tu aplicación:

## 1. Crear el proyecto en Supabase
1. Ingresa a [https://supabase.com/](https://supabase.com/) y crea una cuenta gratuita.
2. Una vez en tu panel de control (Dashboard), haz clic en **"New Project"**.
3. Ponle un nombre a tu proyecto (ej: `FinanzApp`), asegúrate de generar una contraseña segura para la base de datos (guárdala bien) y selecciona la región más cercana a ti.
4. Espera unos minutos a que Supabase configure tu nueva base de datos.

## 2. Copiar las variables de entorno
1. En el panel izquierdo de tu proyecto nuevo en Supabase, ve a **Settings ⚙️** > **API**.
2. Copia la URL del proyecto (**Project URL**).
3. Copia la clave anon pública (**Project API keys -> `anon` public**).
4. Abre el archivo `.env.local` que está en la carpeta de este proyecto (`Control_Gastos`) y reemplaza los valores de ejemplo:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_url_copiada_aqui
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_copiada_aqui
   ```

## 3. Crear las tablas en la Base de Datos
1. Ve al menú lateral izquierdo en Supabase y haz clic en **SQL Editor** (el ícono `</>`).
2. Haz clic en **"New Query"** (Nueva Consulta).
3. Copia todo el siguiente código SQL y pégalo en el editor:

```sql
-- 1. Crear tabla de Perfiles (Profiles)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    currency TEXT NOT NULL DEFAULT 'COP',
    monthly_income_target NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Crear tabla de Ingresos (Incomes)
CREATE TABLE incomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    date DATE NOT NULL,
    is_recurring BOOLEAN DEFAULT false,
    category TEXT NOT NULL CHECK (category IN ('salario', 'freelance', 'otros')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Crear tabla de Categorías de Gastos (Expense Categories)
CREATE TABLE expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    budget_limit NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Crear tabla de Gastos (Expenses)
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES expense_categories(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    date DATE NOT NULL,
    is_recurring BOOLEAN DEFAULT false,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('efectivo', 'tarjeta', 'transferencia')),
    notes TEXT,
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Crear tabla de Metas de Ahorro (Savings Goals)
CREATE TABLE savings_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount NUMERIC NOT NULL CHECK (target_amount > 0),
    current_amount NUMERIC NOT NULL DEFAULT 0,
    deadline DATE,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. HABILITAR SEGURIDAD Y PRIVACIDAD RLS (Row Level Security) --
-- Obligatorio para que los usuarios solo vean sus propios datos
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

-- Crear políticas para que cada quien manipule solo lo suyo
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own incomes" ON incomes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own incomes" ON incomes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own incomes" ON incomes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own incomes" ON incomes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own categories" ON expense_categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON expense_categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON expense_categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON expense_categories FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own expenses" ON expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON expenses FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own goals" ON savings_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON savings_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON savings_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON savings_goals FOR DELETE USING (auth.uid() = user_id);
```

4. Haz clic en el botón verde **"Run"** (o presiona `Ctrl + Enter`). Si todo sale bien, dirá *Success*.

## 4. Activar los logs de Autenticación
Para que la tabla `profiles` se cree de manera automática cuando un usuario se registra:
1. Sigue en el editor SQL, borra el código que tienes, pega esto y dale a "Run":

```sql
-- Trigger para crear perfil a un usuario recién registrado
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, currency, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', 'COP', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

## 5. ¡Listo! Reinicia la app
Ve a la terminal de VSCode (o donde estés ejecutando la app) y simplemente presiona `Ctrl + C` para detenerla y vuelve a correr:
`npm run dev`

¡Felicidades! La aplicación ha sido conectada con éxito a un backend escalable, libre de costo y con la máxima seguridad.
