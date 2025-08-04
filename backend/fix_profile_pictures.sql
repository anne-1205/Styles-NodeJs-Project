USE styles;

-- Fix existing profile pictures that have 'images/' prefix
UPDATE users 
SET profile_picture = SUBSTRING(profile_picture, 8) 
WHERE profile_picture LIKE 'images/%';

-- Show the results
SELECT id, name, email, profile_picture FROM users WHERE profile_picture IS NOT NULL; 