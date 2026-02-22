-- CreateIndex
CREATE INDEX "Event_universId_categorieId_idx" ON "Event"("universId", "categorieId");

-- CreateIndex
CREATE INDEX "Occupation_universId_categorieId_idx" ON "Occupation"("universId", "categorieId");

-- CreateIndex
CREATE INDEX "Organization_universId_categorieId_idx" ON "Organization"("universId", "categorieId");

-- CreateIndex
CREATE INDEX "RelationType_universId_categorieId_idx" ON "RelationType"("universId", "categorieId");

-- CreateIndex
CREATE INDEX "SocialClass_universId_categorieId_idx" ON "SocialClass"("universId", "categorieId");

-- Ensure scoped rows are consistent: categorieId => universId and same univers as category
CREATE OR REPLACE FUNCTION check_scope_category_universe_consistency()
RETURNS TRIGGER AS $$
DECLARE
	category_univers_id INTEGER;
BEGIN
	IF NEW."categorieId" IS NULL THEN
		RETURN NEW;
	END IF;

	IF NEW."universId" IS NULL THEN
		RAISE EXCEPTION 'categorieId requires universId in table %', TG_TABLE_NAME;
	END IF;

	SELECT c."universId"
		INTO category_univers_id
	FROM "Categorie" c
	WHERE c."id" = NEW."categorieId";

	IF category_univers_id IS NULL THEN
		RAISE EXCEPTION 'Invalid categorieId % in table %', NEW."categorieId", TG_TABLE_NAME;
	END IF;

	IF category_univers_id <> NEW."universId" THEN
		RAISE EXCEPTION 'universId % does not match category universId % in table %', NEW."universId", category_univers_id, TG_TABLE_NAME;
	END IF;

	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_scope_socialclass
BEFORE INSERT OR UPDATE ON "SocialClass"
FOR EACH ROW EXECUTE FUNCTION check_scope_category_universe_consistency();

CREATE TRIGGER trg_scope_occupation
BEFORE INSERT OR UPDATE ON "Occupation"
FOR EACH ROW EXECUTE FUNCTION check_scope_category_universe_consistency();

CREATE TRIGGER trg_scope_organization
BEFORE INSERT OR UPDATE ON "Organization"
FOR EACH ROW EXECUTE FUNCTION check_scope_category_universe_consistency();

CREATE TRIGGER trg_scope_relationtype
BEFORE INSERT OR UPDATE ON "RelationType"
FOR EACH ROW EXECUTE FUNCTION check_scope_category_universe_consistency();

CREATE TRIGGER trg_scope_event
BEFORE INSERT OR UPDATE ON "Event"
FOR EACH ROW EXECUTE FUNCTION check_scope_category_universe_consistency();
