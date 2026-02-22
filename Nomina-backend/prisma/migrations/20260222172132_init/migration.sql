-- AlterTable
ALTER TABLE "Lieux" ADD COLUMN     "parentId" INTEGER;

-- AlterTable
ALTER TABLE "Personnage" ADD COLUMN     "birthPlaceId" INTEGER,
ADD COLUMN     "birthYear" INTEGER,
ADD COLUMN     "occupationId" INTEGER,
ADD COLUMN     "residencePlaceId" INTEGER,
ADD COLUMN     "socialClassId" INTEGER;

-- CreateTable
CREATE TABLE "SocialClass" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rank" INTEGER,
    "universId" INTEGER,
    "categorieId" INTEGER,
    "cultureId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Occupation" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "universId" INTEGER,
    "categorieId" INTEGER,
    "cultureId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Occupation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "universId" INTEGER,
    "categorieId" INTEGER,
    "cultureId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonnageOrganization" (
    "id" SERIAL NOT NULL,
    "personnageId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "role" TEXT,
    "startYear" INTEGER,
    "endYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonnageOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelationType" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "universId" INTEGER,
    "categorieId" INTEGER,
    "cultureId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RelationType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonnageRelation" (
    "id" SERIAL NOT NULL,
    "fromPersonnageId" INTEGER NOT NULL,
    "toPersonnageId" INTEGER NOT NULL,
    "relationTypeId" INTEGER NOT NULL,
    "strength" INTEGER,
    "note" TEXT,
    "startYear" INTEGER,
    "endYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonnageRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "startYear" INTEGER,
    "endYear" INTEGER,
    "placeId" INTEGER,
    "universId" INTEGER,
    "cultureId" INTEGER,
    "categorieId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonnageEvent" (
    "id" SERIAL NOT NULL,
    "personnageId" INTEGER NOT NULL,
    "eventId" INTEGER NOT NULL,
    "role" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonnageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SocialClass_universId_idx" ON "SocialClass"("universId");

-- CreateIndex
CREATE INDEX "SocialClass_categorieId_idx" ON "SocialClass"("categorieId");

-- CreateIndex
CREATE INDEX "SocialClass_cultureId_idx" ON "SocialClass"("cultureId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialClass_name_universId_categorieId_cultureId_key" ON "SocialClass"("name", "universId", "categorieId", "cultureId");

-- CreateIndex
CREATE INDEX "Occupation_universId_idx" ON "Occupation"("universId");

-- CreateIndex
CREATE INDEX "Occupation_categorieId_idx" ON "Occupation"("categorieId");

-- CreateIndex
CREATE INDEX "Occupation_cultureId_idx" ON "Occupation"("cultureId");

-- CreateIndex
CREATE UNIQUE INDEX "Occupation_name_universId_categorieId_cultureId_key" ON "Occupation"("name", "universId", "categorieId", "cultureId");

-- CreateIndex
CREATE INDEX "Organization_universId_idx" ON "Organization"("universId");

-- CreateIndex
CREATE INDEX "Organization_categorieId_idx" ON "Organization"("categorieId");

-- CreateIndex
CREATE INDEX "Organization_cultureId_idx" ON "Organization"("cultureId");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_name_universId_categorieId_cultureId_key" ON "Organization"("name", "universId", "categorieId", "cultureId");

-- CreateIndex
CREATE INDEX "PersonnageOrganization_organizationId_idx" ON "PersonnageOrganization"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonnageOrganization_personnageId_organizationId_key" ON "PersonnageOrganization"("personnageId", "organizationId");

-- CreateIndex
CREATE INDEX "RelationType_universId_idx" ON "RelationType"("universId");

-- CreateIndex
CREATE INDEX "RelationType_categorieId_idx" ON "RelationType"("categorieId");

-- CreateIndex
CREATE INDEX "RelationType_cultureId_idx" ON "RelationType"("cultureId");

-- CreateIndex
CREATE UNIQUE INDEX "RelationType_code_universId_categorieId_cultureId_key" ON "RelationType"("code", "universId", "categorieId", "cultureId");

-- CreateIndex
CREATE INDEX "PersonnageRelation_fromPersonnageId_idx" ON "PersonnageRelation"("fromPersonnageId");

-- CreateIndex
CREATE INDEX "PersonnageRelation_toPersonnageId_idx" ON "PersonnageRelation"("toPersonnageId");

-- CreateIndex
CREATE INDEX "PersonnageRelation_relationTypeId_idx" ON "PersonnageRelation"("relationTypeId");

-- CreateIndex
CREATE INDEX "Event_placeId_idx" ON "Event"("placeId");

-- CreateIndex
CREATE INDEX "Event_universId_idx" ON "Event"("universId");

-- CreateIndex
CREATE INDEX "Event_categorieId_idx" ON "Event"("categorieId");

-- CreateIndex
CREATE INDEX "Event_cultureId_idx" ON "Event"("cultureId");

-- CreateIndex
CREATE INDEX "PersonnageEvent_eventId_idx" ON "PersonnageEvent"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonnageEvent_personnageId_eventId_key" ON "PersonnageEvent"("personnageId", "eventId");

-- CreateIndex
CREATE INDEX "Lieux_parentId_idx" ON "Lieux"("parentId");

-- CreateIndex
CREATE INDEX "Lieux_categorieId_idx" ON "Lieux"("categorieId");

-- CreateIndex
CREATE INDEX "Personnage_birthYear_idx" ON "Personnage"("birthYear");

-- CreateIndex
CREATE INDEX "Personnage_socialClassId_idx" ON "Personnage"("socialClassId");

-- CreateIndex
CREATE INDEX "Personnage_occupationId_idx" ON "Personnage"("occupationId");

-- CreateIndex
CREATE INDEX "Personnage_birthPlaceId_idx" ON "Personnage"("birthPlaceId");

-- CreateIndex
CREATE INDEX "Personnage_residencePlaceId_idx" ON "Personnage"("residencePlaceId");

-- CreateIndex
CREATE INDEX "Personnage_cultureId_idx" ON "Personnage"("cultureId");

-- CreateIndex
CREATE INDEX "Personnage_categorieId_idx" ON "Personnage"("categorieId");

-- AddForeignKey
ALTER TABLE "Lieux" ADD CONSTRAINT "Lieux_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Lieux"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Personnage" ADD CONSTRAINT "Personnage_socialClassId_fkey" FOREIGN KEY ("socialClassId") REFERENCES "SocialClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Personnage" ADD CONSTRAINT "Personnage_occupationId_fkey" FOREIGN KEY ("occupationId") REFERENCES "Occupation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Personnage" ADD CONSTRAINT "Personnage_birthPlaceId_fkey" FOREIGN KEY ("birthPlaceId") REFERENCES "Lieux"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Personnage" ADD CONSTRAINT "Personnage_residencePlaceId_fkey" FOREIGN KEY ("residencePlaceId") REFERENCES "Lieux"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialClass" ADD CONSTRAINT "SocialClass_universId_fkey" FOREIGN KEY ("universId") REFERENCES "UniversThematique"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialClass" ADD CONSTRAINT "SocialClass_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "Categorie"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialClass" ADD CONSTRAINT "SocialClass_cultureId_fkey" FOREIGN KEY ("cultureId") REFERENCES "Culture"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Occupation" ADD CONSTRAINT "Occupation_universId_fkey" FOREIGN KEY ("universId") REFERENCES "UniversThematique"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Occupation" ADD CONSTRAINT "Occupation_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "Categorie"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Occupation" ADD CONSTRAINT "Occupation_cultureId_fkey" FOREIGN KEY ("cultureId") REFERENCES "Culture"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_universId_fkey" FOREIGN KEY ("universId") REFERENCES "UniversThematique"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "Categorie"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_cultureId_fkey" FOREIGN KEY ("cultureId") REFERENCES "Culture"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonnageOrganization" ADD CONSTRAINT "PersonnageOrganization_personnageId_fkey" FOREIGN KEY ("personnageId") REFERENCES "Personnage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonnageOrganization" ADD CONSTRAINT "PersonnageOrganization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationType" ADD CONSTRAINT "RelationType_universId_fkey" FOREIGN KEY ("universId") REFERENCES "UniversThematique"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationType" ADD CONSTRAINT "RelationType_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "Categorie"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationType" ADD CONSTRAINT "RelationType_cultureId_fkey" FOREIGN KEY ("cultureId") REFERENCES "Culture"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonnageRelation" ADD CONSTRAINT "PersonnageRelation_fromPersonnageId_fkey" FOREIGN KEY ("fromPersonnageId") REFERENCES "Personnage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonnageRelation" ADD CONSTRAINT "PersonnageRelation_toPersonnageId_fkey" FOREIGN KEY ("toPersonnageId") REFERENCES "Personnage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonnageRelation" ADD CONSTRAINT "PersonnageRelation_relationTypeId_fkey" FOREIGN KEY ("relationTypeId") REFERENCES "RelationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Lieux"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_universId_fkey" FOREIGN KEY ("universId") REFERENCES "UniversThematique"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_cultureId_fkey" FOREIGN KEY ("cultureId") REFERENCES "Culture"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "Categorie"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonnageEvent" ADD CONSTRAINT "PersonnageEvent_personnageId_fkey" FOREIGN KEY ("personnageId") REFERENCES "Personnage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonnageEvent" ADD CONSTRAINT "PersonnageEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
