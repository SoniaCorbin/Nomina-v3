-- Add optional imageUrl columns for admin-uploaded illustrations
ALTER TABLE "UniversThematique" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "Categorie" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "Culture" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "Lieux" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
