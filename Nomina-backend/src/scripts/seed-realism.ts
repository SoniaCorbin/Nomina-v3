import prisma from '../utils/prisma';

function pickOne<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randInt(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function slugMini(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 3)
    .join(' ');
}

type Scope = { universId: number | null; categorieId: number | null; cultureId: number | null };

async function upsertSocialClass(name: string, description: string | null, rank: number | null, scope: Scope) {
  const existing = await prisma.socialClass.findFirst({ where: { name, ...scope }, select: { id: true } });

  if (!existing) {
    return prisma.socialClass.create({
      data: { name, description, rank, ...scope },
    });
  }

  return prisma.socialClass.update({
    where: { id: existing.id },
    data: { description, rank },
  });
}

async function upsertOccupation(name: string, description: string | null, scope: Scope) {
  const existing = await prisma.occupation.findFirst({ where: { name, ...scope }, select: { id: true } });

  if (!existing) {
    return prisma.occupation.create({
      data: { name, description, ...scope },
    });
  }

  return prisma.occupation.update({
    where: { id: existing.id },
    data: { description },
  });
}

async function upsertRelationType(code: string, label: string, description: string | null, scope: Scope) {
  const existing = await prisma.relationType.findFirst({ where: { code, ...scope }, select: { id: true } });

  if (!existing) {
    return prisma.relationType.create({
      data: { code, label, description, ...scope },
    });
  }

  return prisma.relationType.update({
    where: { id: existing.id },
    data: { label, description },
  });
}

async function upsertOrganization(name: string, type: string | null, description: string | null, scope: Scope) {
  const existing = await prisma.organization.findFirst({ where: { name, ...scope }, select: { id: true } });

  if (!existing) {
    return prisma.organization.create({
      data: { name, type, description, ...scope },
    });
  }

  return prisma.organization.update({
    where: { id: existing.id },
    data: { type, description },
  });
}

async function upsertEvent(
  title: string,
  summary: string | null,
  startYear: number | null,
  endYear: number | null,
  scope: Scope,
  placeId: number | null = null
) {
  const existing = await prisma.event.findFirst({
    where: { title, ...scope },
    select: { id: true },
  });

  if (!existing) {
    return prisma.event.create({
      data: { title, summary, startYear, endYear, placeId, ...scope },
    });
  }

  return prisma.event.update({
    where: { id: existing.id },
    data: { summary, startYear, endYear, placeId },
  });
}

async function seedReferenceGlobalAndPerUnivers() {
  const global: Scope = { universId: null, categorieId: null, cultureId: null };

  const socialClasses: Array<{ name: string; description: string; rank: number }> = [
    { name: 'Précaire', description: 'Ressources instables, faible influence.', rank: 1 },
    { name: 'Modeste', description: 'Revenus modestes, réseau local.', rank: 2 },
    { name: 'Classe moyenne', description: 'Stabilité, accès aux services.', rank: 4 },
    { name: 'Aisée', description: 'Bon revenu, capital, influence locale.', rank: 6 },
    { name: 'Élite', description: 'Pouvoir social et économique.', rank: 8 },
    { name: 'Autorité', description: 'Fonction officielle (justice, administration, ordre).', rank: 7 },
    { name: 'Marginal', description: 'Hors des normes, clandestin ou exclu.', rank: 2 },
    { name: 'Itinérant', description: 'Sans attache fixe, vit du déplacement.', rank: 3 },
    { name: 'Clergé', description: 'Autorité morale/spirituelle (selon l’univers).', rank: 6 },
    { name: 'Militaire', description: 'Structure hiérarchique, discipline.', rank: 5 },
  ];
  for (const sc of socialClasses) await upsertSocialClass(sc.name, sc.description, sc.rank, global);

  const occupations: Array<{ name: string; description: string }> = [
    { name: 'Agriculteur', description: 'Cultive, gère les récoltes.' },
    { name: 'Éleveur', description: 'S’occupe des animaux.' },
    { name: 'Pêcheur', description: 'Approvisionnement, météo, eaux.' },
    { name: 'Chasseur', description: 'Survie, pistage.' },
    { name: 'Bûcheron', description: 'Exploitation forestière.' },
    { name: 'Mineur', description: 'Extraction, risques.' },
    { name: 'Artisan', description: 'Production de biens usuels.' },
    { name: 'Forgeron', description: 'Métaux, maintenance.' },
    { name: 'Charpentier', description: 'Construction, réparation.' },
    { name: 'Maçon', description: 'Bâtiments, infrastructures.' },
    { name: 'Tailleur', description: 'Vêtements, codes sociaux.' },
    { name: 'Cuisinier', description: 'Cuisine, hygiène, stocks.' },
    { name: 'Aubergiste', description: 'Hospitalité, rumeurs.' },
    { name: 'Marchand', description: 'Achat/vente, réseaux.' },
    { name: 'Comptable', description: 'Registres, dettes.' },
    { name: 'Messager', description: 'Livraisons, délais.' },
    { name: 'Marin', description: 'Navigation.' },
    { name: 'Batelier', description: 'Transport fluvial.' },
    { name: 'Conducteur', description: 'Transport terrestre.' },
    { name: 'Garde', description: 'Sécurité, contrôle.' },
    { name: 'Soldat', description: 'Force organisée.' },
    { name: 'Enquêteur', description: 'Faits, preuves, pistes.' },
    { name: 'Diplomate', description: 'Négociation, protocole.' },
    { name: 'Serviteur', description: 'Service domestique.' },
    { name: 'Artiste', description: 'Création, performance.' },
    { name: 'Écrivain', description: 'Récits, archives.' },
    { name: 'Archiviste', description: 'Mémoire, documents.' },
    { name: 'Enseignant', description: 'Transmission.' },
    { name: 'Érudit', description: 'Recherche.' },
    { name: 'Médecin', description: 'Soins, diagnostics.' },
    { name: 'Herboriste', description: 'Remèdes.' },
    { name: 'Ingénieur', description: 'Conception de systèmes.' },
    { name: 'Technicien', description: 'Maintenance.' },
    { name: 'Ouvrier', description: 'Chantiers, production.' },
    { name: 'Guide', description: 'Orientation, terrain.' },
    { name: 'Interprète', description: 'Langues, médiation.' },
    { name: 'Avocat', description: 'Défense, procédure.' },
    { name: 'Juge', description: 'Arbitrage, sanctions.' },
    { name: 'Clerc', description: 'Administration, registres.' },
    { name: 'Contrebandier', description: 'Routes parallèles.' },
    { name: 'Voleur', description: 'Discrétion, opportunisme.' },
  ];
  for (const o of occupations) await upsertOccupation(o.name, o.description, global);

  const relationTypes: Array<{ code: string; label: string; description: string }> = [
    { code: 'PARENT', label: 'Parent / enfant', description: 'Lien familial direct.' },
    { code: 'SIBLING', label: 'Fratrie', description: 'Frère / sœur (ou équivalent).' },
    { code: 'SPOUSE', label: 'Conjoint', description: 'Union reconnue.' },
    { code: 'PARTNER', label: 'Partenaire', description: 'Partenariat durable.' },
    { code: 'FRIEND', label: 'Ami', description: 'Affinité, soutien.' },
    { code: 'ALLY', label: 'Allié', description: 'Alliance pragmatique.' },
    { code: 'RIVAL', label: 'Rival', description: 'Compétition, tension.' },
    { code: 'ENEMY', label: 'Ennemi', description: 'Hostilité active.' },
    { code: 'MENTOR', label: 'Mentor', description: 'Encadre, transmet.' },
    { code: 'STUDENT', label: 'Élève', description: 'Reçoit un enseignement.' },
    { code: 'EMPLOYER', label: 'Employeur', description: 'Donne du travail.' },
    { code: 'EMPLOYEE', label: 'Employé', description: 'Travaille pour une structure.' },
    { code: 'COLLEAGUE', label: 'Collègue', description: 'Travail partagé.' },
    { code: 'DEBTOR', label: 'Débiteur', description: 'Doit quelque chose.' },
    { code: 'CREDITOR', label: 'Créancier', description: 'A une dette à recouvrer.' },
    { code: 'CONTACT', label: 'Contact', description: 'Lien opportun.' },
    { code: 'PROTECTOR', label: 'Protecteur', description: 'Protège, sponsorise.' },
    { code: 'PROTEGE', label: 'Protégé', description: 'Bénéficie d’une protection.' },
    { code: 'NEIGHBOR', label: 'Voisin', description: 'Proximité géographique.' },
    { code: 'SUSPECT', label: 'Suspect', description: 'Lien de méfiance.' },
  ];
  for (const rt of relationTypes) await upsertRelationType(rt.code, rt.label, rt.description, global);

  const organizations: Array<{ name: string; type: string; description: string }> = [
    { name: 'Bureau des registres', type: 'Administration', description: 'Naissances, contrats, propriétés.' },
    { name: 'Tribunal local', type: 'Justice', description: 'Litiges, sanctions.' },
    { name: 'Garde civique', type: 'Sécurité', description: 'Patrouilles, contrôles.' },
    { name: 'Académie', type: 'Éducation', description: 'Formation, examens.' },
    { name: 'Maison de commerce', type: 'Commerce', description: 'Import/export, réseaux.' },
    { name: 'Compagnie de transport', type: 'Transport', description: 'Livraison, logistique.' },
    { name: 'Atelier collectif', type: 'Artisanat', description: 'Production, apprentissage.' },
    { name: 'Maison de soin', type: 'Santé', description: 'Soins, crise sanitaire.' },
    { name: 'Banque locale', type: 'Finance', description: 'Prêts, dettes.' },
    { name: 'Réseau de presse', type: 'Média', description: 'Information, influence.' },
    { name: 'Association de quartier', type: 'Communauté', description: 'Entraide, règles locales.' },
    { name: 'Bourse du travail', type: 'Travail', description: 'Contrats, placement.' },
  ];
  for (const org of organizations) await upsertOrganization(org.name, org.type, org.description, global);

  const events: Array<{ title: string; summary: string }> = [
    { title: 'Incendie majeur', summary: 'Un sinistre détruit logements/ateliers; reconstruction et tensions.' },
    { title: 'Pénurie', summary: 'Rupture d’approvisionnement; hausse des prix, marché noir.' },
    { title: 'Grève', summary: 'Arrêt de travail; négociation, pressions, compromis.' },
    { title: 'Émeute', summary: 'Colère collective; dégâts, arrestations, réformes.' },
    { title: 'Procès public', summary: 'Affaire médiatisée; témoins, preuves, verdict.' },
    { title: 'Accident de chantier', summary: 'Blessures; enquête, responsabilités.' },
    { title: 'Scandale', summary: 'Révélations; chute de réputation, opportunités.' },
    { title: 'Épidémie locale', summary: 'Maladie; mesures, rumeurs, tensions.' },
    { title: 'Découverte d’archives', summary: 'Documents révélés; secrets, héritages.' },
    { title: 'Migration', summary: 'Arrivée/départ massif; pression sur logements, travail.' },
    { title: 'Accord commercial', summary: 'Nouveau traité; routes, taxes, gagnants/perdants.' },
    { title: 'Crise financière', summary: 'Défauts de paiement; faillites, saisies.' },
    { title: 'Disparition inquiétante', summary: 'Quelqu’un manque; enquête, implications.' },
    { title: 'Catastrophe naturelle', summary: 'Tempête/séisme/inondation; reconstruction.' },
    { title: 'Réforme administrative', summary: 'Nouvelles règles; contrôles, résistances.' },
    { title: 'Ouverture d’une route', summary: 'Nouvel axe; commerce accru, nouveaux risques.' },
    { title: 'Fermeture d’une route', summary: 'Blocage; isolement, contrebande.' },
    { title: 'Conflit territorial', summary: 'Tensions sur une zone; médiation, escalade.' },
    { title: 'Festival', summary: 'Événement culturel; rencontres, rivalités.' },
    { title: 'Nomination officielle', summary: 'Changement de poste; alliances et conflits.' },
  ];
  for (const e of events) await upsertEvent(e.title, e.summary, null, null, global);

  const universList = await prisma.universThematique.findMany({
    select: { id: true, name: true },
    orderBy: { id: 'asc' },
  });

  for (const u of universList) {
    const sig = slugMini(u.name);
    const scope: Scope = { universId: u.id, categorieId: null, cultureId: null };

    await upsertOccupation(`Opérateur (${sig})`, `Spécialiste opérationnel associé à "${u.name}".`, scope);
    await upsertOccupation(`Analyste (${sig})`, `Analyse de signaux et tendances dans "${u.name}".`, scope);
    await upsertOccupation(`Intermédiaire (${sig})`, `Négociateur et fixeur dans "${u.name}".`, scope);

    await upsertOrganization(`Bureau central (${sig})`, 'Administration', `Coordination pour "${u.name}".`, scope);
    await upsertOrganization(`Institut (${sig})`, 'Recherche', `Recherche/formation lié à "${u.name}".`, scope);

    await upsertEvent(`Incident notable (${sig})`, `Incident ayant marqué "${u.name}".`, null, null, scope);
    await upsertEvent(`Réorganisation majeure (${sig})`, `Changement de structures dans "${u.name}".`, null, null, scope);
  }
}

async function seedPlacesForDemoCategories(maxCategories = 30) {
  const usedCategories = await prisma.personnage.findMany({
    where: { categorieId: { not: null } },
    select: { categorieId: true },
    distinct: ['categorieId'],
  });

  const catIds = usedCategories.map((x) => x.categorieId!).slice(0, maxCategories);
  if (!catIds.length) return;

  for (const categorieId of catIds) {
    const already = await prisma.lieux.findFirst({ where: { categorieId, parentId: null, type: 'COUNTRY' } });
    if (already) continue;

    const country = await prisma.lieux.create({
      data: { value: `Pays-${categorieId}`, type: 'COUNTRY', categorieId },
    });

    const regions = await Promise.all(
      ['Nord', 'Sud'].map((r) =>
        prisma.lieux.create({
          data: { value: `Région ${r}-${categorieId}`, type: 'REGION', categorieId, parentId: country.id },
        })
      )
    );

    for (const region of regions) {
      const villes = await Promise.all(
        ['Centre', 'Port', 'Hauteurs'].map((v) =>
          prisma.lieux.create({
            data: { value: `Ville ${v}-${categorieId}`, type: 'CITY', categorieId, parentId: region.id },
          })
        )
      );

      for (const ville of villes) {
        await Promise.all(
          ['Vieux-Quartier', 'Marché'].map((q) =>
            prisma.lieux.create({
              data: { value: `${q}-${categorieId}`, type: 'DISTRICT', categorieId, parentId: ville.id },
            })
          )
        );
      }
    }
  }
}

async function enrichPersonnagesAndCreateLinks() {
  const personnages = await prisma.personnage.findMany({
    select: { id: true, categorieId: true, cultureId: true, birthYear: true },
  });
  if (!personnages.length) return;

  const socialClasses = await prisma.socialClass.findMany({
    select: { id: true, categorieId: true, cultureId: true, universId: true },
  });
  const occupations = await prisma.occupation.findMany({
    select: { id: true, categorieId: true, cultureId: true, universId: true },
  });
  const organizations = await prisma.organization.findMany({
    select: { id: true, categorieId: true, cultureId: true, universId: true },
  });
  const relationTypes = await prisma.relationType.findMany({
    select: { id: true, code: true, categorieId: true, cultureId: true, universId: true },
  });
  const events = await prisma.event.findMany({
    select: { id: true, categorieId: true, cultureId: true, universId: true },
  });
  const places = await prisma.lieux.findMany({
    select: { id: true, categorieId: true, type: true },
  });

  function scoped<T extends { categorieId: number | null; cultureId: number | null }>(
    items: T[],
    scope: { categorieId: number | null; cultureId: number | null }
  ) {
    if (scope.categorieId != null) {
      const exact = items.filter(
        (x) =>
          x.categorieId === scope.categorieId &&
          (scope.cultureId == null || x.cultureId === scope.cultureId || x.cultureId == null)
      );
      if (exact.length) return exact;
    }

    if (scope.cultureId != null) {
      const byCulture = items.filter((x) => x.cultureId === scope.cultureId && x.categorieId == null);
      if (byCulture.length) return byCulture;
    }

    return items.filter((x) => x.categorieId == null && x.cultureId == null);
  }

  const byCat = new Map<number, number[]>();
  for (const p of personnages) {
    if (p.categorieId == null) continue;
    const arr = byCat.get(p.categorieId) ?? [];
    arr.push(p.id);
    byCat.set(p.categorieId, arr);
  }

  const preferredRelationCodes = ['FRIEND', 'ALLY', 'COLLEAGUE', 'MENTOR', 'RIVAL', 'ENEMY', 'DEBTOR', 'CREDITOR'];

  let updated = 0;
  let relCreated = 0;
  let orgCreated = 0;
  let evCreated = 0;

  for (const p of personnages) {
    const scope = { categorieId: p.categorieId ?? null, cultureId: p.cultureId ?? null };

    const sc = pickOne(scoped(socialClasses, scope));
    const oc = pickOne(scoped(occupations, scope));
    const org = pickOne(scoped(organizations, scope));
    const ev = pickOne(scoped(events, scope));

    const placePool = places.filter((x) => scope.categorieId != null && x.categorieId === scope.categorieId);
    const cityPool = placePool.filter((x) => x.type === 'CITY');
    const districtPool = placePool.filter((x) => x.type === 'DISTRICT');

    const birthYear = p.birthYear ?? randInt(1960, 2010);
    const birthPlaceId = pickOne(cityPool)?.id ?? pickOne(placePool)?.id ?? null;
    const residencePlaceId = pickOne(districtPool)?.id ?? pickOne(cityPool)?.id ?? birthPlaceId;

    await prisma.personnage.update({
      where: { id: p.id },
      data: {
        birthYear,
        socialClassId: sc?.id ?? null,
        occupationId: oc?.id ?? null,
        birthPlaceId,
        residencePlaceId,
      },
    });
    updated++;

    if (org && Math.random() < 0.55) {
      await prisma.personnageOrganization
        .create({
          data: {
            personnageId: p.id,
            organizationId: org.id,
            role: null,
            startYear: Math.random() < 0.5 ? randInt(birthYear + 16, 2025) : null,
            endYear: null,
          },
        })
        .then(() => orgCreated++)
        .catch(() => {});
    }

    if (ev && Math.random() < 0.65) {
      await prisma.personnageEvent
        .create({
          data: { personnageId: p.id, eventId: ev.id, role: null, note: null },
        })
        .then(() => evCreated++)
        .catch(() => {});
    }

    let candidates: number[] = [];
    if (scope.categorieId != null) candidates = (byCat.get(scope.categorieId) ?? []).filter((id) => id !== p.id);
    if (!candidates.length) candidates = personnages.map((x) => x.id).filter((id) => id !== p.id);

    const toId = pickOne(candidates);
    const rtPoolAll = scoped(relationTypes, scope);
    const rtPool = rtPoolAll.filter((x: any) => preferredRelationCodes.includes(x.code));
    const rt = pickOne(rtPool.length ? rtPool : rtPoolAll);

    if (toId && rt) {
      await prisma.personnageRelation
        .create({
          data: {
            fromPersonnageId: p.id,
            toPersonnageId: toId,
            relationTypeId: rt.id,
            strength: randInt(1, 10),
            note: null,
            startYear: Math.random() < 0.3 ? randInt(birthYear + 10, 2025) : null,
            endYear: null,
          },
        })
        .then(() => relCreated++)
        .catch(() => {});
    }
  }

  console.log(
    `Enriched Personnage: updated=${updated}, orgLinks=${orgCreated}, eventLinks=${evCreated}, relations=${relCreated}`
  );
}

async function main() {
  console.log('Seed realism: 1) reference data...');
  await seedReferenceGlobalAndPerUnivers();

  console.log('Seed realism: 2) places (demo subset)...');
  await seedPlacesForDemoCategories(30);

  console.log('Seed realism: 3) enrich personnages + links...');
  await enrichPersonnagesAndCreateLinks();

  console.log('Seed realism complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
