-- Drop problematic policies that cause circular dependencies
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins or owner can view roles" ON user_roles;

-- Allow users to view their own role (no circular dependency)
CREATE POLICY "Users can view own role"
ON user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow admins to view all roles (using has_role is safe here because admins already have their role loaded)
CREATE POLICY "Admins can view all roles"
ON user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Keep admin-only policies for modifications
-- (These already exist and are correct)