/*
  # Authentication and User Management Schema

  1. New Tables
    - `profiles` - Stores user profile information
      - `id` (uuid, primary key) - References auth.users.id
      - `email` (text) - User's email address
      - `full_name` (text) - User's full name
      - `username` (text, unique) - User's chosen username
      - `avatar_url` (text) - URL to user's profile picture
      - `school` (text) - User's selected school
      - `created_at` (timestamptz) - When the profile was created
      - `updated_at` (timestamptz) - When the profile was last updated
    
    - `schools` - List of available schools
      - `id` (uuid, primary key)
      - `name` (text) - School name
      - `location` (text) - School location
      - `domain` (text) - School email domain
      - `created_at` (timestamptz) - When the school was added
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read/write their own data
    - Add policies for public access to schools table (read-only)
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  school TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create schools table
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  domain TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert some sample schools
INSERT INTO schools (name, location, domain)
VALUES 
  ('University of Ghana', 'Accra, Ghana', 'ug.edu.gh'),
  ('Kwame Nkrumah University of Science and Technology', 'Kumasi, Ghana', 'knust.edu.gh'),
  ('University of Cape Coast', 'Cape Coast, Ghana', 'ucc.edu.gh'),
  ('Ashesi University', 'Berekuso, Ghana', 'ashesi.edu.gh'),
  ('Ghana Institute of Management and Public Administration', 'Accra, Ghana', 'gimpa.edu.gh'),
  ('University of Education, Winneba', 'Winneba, Ghana', 'uew.edu.gh'),
  ('University of Development Studies', 'Tamale, Ghana', 'uds.edu.gh'),
  ('University of Professional Studies', 'Accra, Ghana', 'upsa.edu.gh'),
  ('Central University', 'Accra, Ghana', 'central.edu.gh'),
  ('Valley View University', 'Accra, Ghana', 'vvu.edu.gh');

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create policies for schools (public read-only)
CREATE POLICY "Anyone can view schools"
  ON schools
  FOR SELECT
  TO PUBLIC
  USING (true);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();