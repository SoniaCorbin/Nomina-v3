import prisma from '../utils/prisma';

type Scoped = {
  universId?: number | null;
  categorieId?: number | null;
  cultureId?: number | null;
};

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

async function upsertOccupation(name: string, description: string | null, scope: Scoped) {
  const universId = scope.universId ?? null;
  const categorieId = scope.categorieId ?? null;
  const cultureId = scope.cultureId ?? null;

  const existing = await prisma.occupation.findFirst({
    where: { name, universId, categorieId, cultureId },
    select: { id: true },
  });

  if (!existing) {
    return prisma.occupation.create({
      data: { name, description, universId, categorieId, cultureId },
    });
  }

  return prisma.occupation.update({
    where: { id: existing.id },
    data: { description },
  });
}

async function upsertSocialClass(name: string, description: string | null, rank: number | null, scope: Scoped) {
  const universId = scope.universId ?? null;
  const categorieId = scope.categorieId ?? null;
  const cultureId = scope.cultureId ?? null;

  const existing = await prisma.socialClass.findFirst({
    where: { name, universId, categorieId, cultureId },
    select: { id: true },
  });

  if (!existing) {
    return prisma.socialClass.create({
      data: { name, description, rank, universId, categorieId, cultureId },
    });
  }

  return prisma.socialClass.update({
    where: { id: existing.id },
    data: { description, rank },
  });
}

async function upsertRelationType(code: string, label: string, description: string | null, scope: Scoped) {
  const universId = scope.universId ?? null;
  const categorieId = scope.categorieId ?? null;
  const cultureId = scope.cultureId ?? null;

  const existing = await prisma.relationType.findFirst({
    where: { code, universId, categorieId, cultureId },
    select: { id: true },
  });

  if (!existing) {
    return prisma.relationType.create({
      data: { code, label, description, universId, categorieId, cultureId },
    });
  }

  return prisma.relationType.update({
    where: { id: existing.id },
    data: { label, description },
  });
}

async function upsertOrganization(name: string, type: string | null, description: string | null, scope: Scoped) {
  const universId = scope.universId ?? null;
  const categorieId = scope.categorieId ?? null;
  const cultureId = scope.cultureId ?? null;

  const existing = await prisma.organization.findFirst({
    where: { name, universId, categorieId, cultureId },
    select: { id: true },
  });

  if (!existing) {
    return prisma.organization.create({
      data: { name, type, description, universId, categorieId, cultureId },
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
  scope: Scoped
) {
  const universId = scope.universId ?? null;
  const categorieId = scope.categorieId ?? null;
  const cultureId = scope.cultureId ?? null;

  const existing = await prisma.event.findFirst({
    where: { title, universId, categorieId, cultureId },
    select: { id: true },
  });

  if (!existing) {
    return prisma.event.create({
      data: { title, summary, startYear, endYear, universId, categorieId, cultureId },
    });
  }

  return prisma.event.update({
    where: { id: existing.id },
    data: { summary, startYear, endYear },
  });
}

async function seedGlobal() {
  const scope: Scoped = { universId: null, categorieId: null, cultureId: null };

  const socialClasses: Array<{ name: string; description: string; rank: number }> = [
    { name: 'Précaire', description: 'Ressources instables, faible influence.', rank: 1 },
    { name: 'Modeste', description: 'Revenus modestes, réseau local.', rank: 2 },
    { name: 'Classe moyenne', description: 'Stabilité, accès aux services et à l’éducation.', rank: 4 },
    { name: 'Aisée', description: 'Bon revenu, capital, influence locale.', rank: 6 },
    { name: 'Élite', description: 'Pouvoir économique et social, réseau étendu.', rank: 8 },
    { name: 'Autorité', description: 'Fonction officielle (justice, administration, ordre).', rank: 7 },
    { name: 'Marginal', description: 'Hors des normes, clandestin ou exclu.', rank: 2 },
    { name: 'Itinérant', description: 'Sans attache fixe, vit du déplacement.', rank: 3 },
    { name: 'Clergé', description: 'Autorité morale/spirituelle (selon l’univers).', rank: 6 },
    { name: 'Militaire', description: 'Structure hiérarchique, accès à la force organisée.', rank: 5 },
  ];

  for (const sc of socialClasses) {
    await upsertSocialClass(sc.name, sc.description, sc.rank, scope);
  }

  const occupations: Array<{ name: string; description: string }> = [
    { name: 'Agriculteur', description: 'Cultive, gère les récoltes et la saisonnalité.' },
    { name: 'Éleveur', description: 'S’occupe des animaux et des ressources associées.' },
    { name: 'Pêcheur', description: 'Approvisionnement, météo, connaissance des eaux.' },
    { name: 'Chasseur', description: 'Traque, survie, gestion du risque.' },
    { name: 'Bûcheron', description: 'Exploitation forestière, transport, dangers naturels.' },
    { name: 'Mineur', description: 'Extraction, travail pénible, risques d’accident.' },
    { name: 'Artisan', description: 'Produit des biens: outils, vêtements, objets usuels.' },
    { name: 'Forgeron', description: 'Travail des métaux, maintenance et fabrication.' },
    { name: 'Charpentier', description: 'Construction, réparation, structures.' },
    { name: 'Maçon', description: 'Bâtiments, ouvrages, infrastructures.' },
    { name: 'Tailleur', description: 'Vêtements, retouches, codes sociaux.' },
    { name: 'Cuisinier', description: 'Préparation, gestion des stocks, hygiène.' },
    { name: 'Aubergiste', description: 'Hospitalité, rumeurs, logistique locale.' },
    { name: 'Marchand', description: 'Achat/vente, négociation, réseaux.' },
    { name: 'Comptable', description: 'Registres, dettes, paiements, audits.' },
    { name: 'Messager', description: 'Livraisons, délais, discrétion.' },
    { name: 'Marin', description: 'Navigation, discipline, risques climatiques.' },
    { name: 'Batelier', description: 'Transport fluvial, routes d’eau.' },
    { name: 'Conducteur', description: 'Transport terrestre, entretien, itinéraires.' },
    { name: 'Garde', description: 'Sécurité, contrôle, maintien de l’ordre.' },
    { name: 'Soldat', description: 'Force organisée, entraînement, obéissance.' },
    { name: 'Enquêteur', description: 'Recherche de faits, interrogatoires, preuves.' },
    { name: 'Diplomate', description: 'Négociation, protocole, arbitrage.' },
    { name: 'Serviteur', description: 'Service domestique, accès indirect à l’information.' },
    { name: 'Artiste', description: 'Création, performance, influence culturelle.' },
    { name: 'Écrivain', description: 'Récits, archives, diffusion d’idées.' },
    { name: 'Archiviste', description: 'Classement, mémoire, accès aux documents.' },
    { name: 'Enseignant', description: 'Transmission, formation, sélection.' },
    { name: 'Érudit', description: 'Recherche, théorie, méthodes.' },
    { name: 'Médecin', description: 'Soins, diagnostics, pratique.' },
    { name: 'Herboriste', description: 'Remèdes, collecte, savoir empirique.' },
    { name: 'Ingénieur', description: 'Conception, optimisation, systèmes.' },
    { name: 'Technicien', description: 'Maintenance, réparation, instrumentation.' },
    { name: 'Ouvrier', description: 'Travail manuel, chantiers, production.' },
    { name: 'Guide', description: 'Orientation, sécurité, connaissance du terrain.' },
    { name: 'Interprète', description: 'Langues, médiation, précision.' },
    { name: 'Avocat', description: 'Procédure, défense, stratégie juridique.' },
    { name: 'Juge', description: 'Arbitrage, décisions, sanctions.' },
    { name: 'Clerc', description: 'Administration, registres, formulaires.' },
    { name: 'Contrebandier', description: 'Routes parallèles, discrétion, risques.' },
    { name: 'Voleur', description: 'Discrétion, opportunisme, survie.' },
  ];

  for (const o of occupations) {
    await upsertOccupation(o.name, o.description, scope);
  }

  const relationTypes: Array<{ code: string; label: string; description: string }> = [
    { code: 'PARENT', label: 'Parent / enfant', description: 'Lien familial direct.' },
    { code: 'SIBLING', label: 'Fratrie', description: 'Frère / sœur (ou équivalent).' },
    { code: 'SPOUSE', label: 'Conjoint', description: 'Mariage/union reconnue.' },
    { code: 'PARTNER', label: 'Partenaire', description: 'Partenariat durable (pro/perso).' },
    { code: 'FRIEND', label: 'Ami', description: 'Affinité, soutien mutuel.' },
    { code: 'ALLY', label: 'Allié', description: 'Alliance pragmatique ou idéologique.' },
    { code: 'RIVAL', label: 'Rival', description: 'Compétition, tension non forcément violente.' },
    { code: 'ENEMY', label: 'Ennemi', description: 'Hostilité active.' },
    { code: 'MENTOR', label: 'Mentor', description: 'Transmet savoir, encadre.' },
    { code: 'STUDENT', label: 'Élève', description: 'Reçoit un enseignement.' },
    { code: 'EMPLOYER', label: 'Employeur', description: 'Donne du travail, fixe des attentes.' },
    { code: 'EMPLOYEE', label: 'Employé', description: 'Travaille pour quelqu’un/une structure.' },
    { code: 'COLLEAGUE', label: 'Collègue', description: 'Travail partagé, collaboration.' },
    { code: 'DEBTOR', label: 'Débiteur', description: 'Doit quelque chose (argent/service).' },
    { code: 'CREDITOR', label: 'Créancier', description: 'A une dette à recouvrer.' },
    { code: 'CONTACT', label: 'Contact', description: 'Lien opportun, informationnel.' },
    { code: 'PROTECTOR', label: 'Protecteur', description: 'Protège, sponsorise, couvre.' },
    { code: 'PROTEGE', label: 'Protégé', description: 'Bénéficie d’une protection.' },
    { code: 'NEIGHBOR', label: 'Voisin', description: 'Proximité géographique/sociale.' },
    { code: 'SUSPECT', label: 'Suspect', description: 'Lien de méfiance, soupçon.' },
  ];

  for (const rt of relationTypes) {
    await upsertRelationType(rt.code, rt.label, rt.description, scope);
  }

  const organizations: Array<{ name: string; type: string; description: string }> = [
    { name: 'Bureau des registres', type: 'Administration', description: 'Enregistrement des naissances, contrats, propriétés.' },
    { name: 'Tribunal local', type: 'Justice', description: 'Arbitrage des litiges, sanctions, jurisprudence.' },
    { name: 'Garde civique', type: 'Sécurité', description: 'Maintien de l’ordre, patrouilles, contrôles.' },
    { name: 'Académie', type: 'Éducation', description: 'Formation, examens, accès au savoir.' },
    { name: 'Maison de commerce', type: 'Commerce', description: 'Négociation, import/export, réseaux.' },
    { name: 'Compagnie de transport', type: 'Transport', description: 'Routes, livraisons, logistique.' },
    { name: 'Atelier collectif', type: 'Artisanat', description: 'Production, apprentissage, standards.' },
    { name: 'Maison de soin', type: 'Santé', description: 'Soins, triage, gestion des crises.' },
    { name: 'Bourse du travail', type: 'Travail', description: 'Placement, contrats, médiation.' },
    { name: 'Banque locale', type: 'Finance', description: 'Dépôts, prêts, dettes, garanties.' },
    { name: 'Réseau de presse', type: 'Média', description: 'Information, influence, rumeurs.' },
    { name: 'Association de quartier', type: 'Communauté', description: 'Solidarité, règles locales, entraide.' },
  ];

  for (const org of organizations) {
    await upsertOrganization(org.name, org.type, org.description, scope);
  }

  const events: Array<{ title: string; summary: string }> = [
    { title: 'Incendie majeur', summary: 'Un sinistre détruit des logements/ateliers et bouleverse les équilibres.' },
    { title: 'Pénurie', summary: 'Rupture d’approvisionnement; hausse des prix, tensions et marché noir.' },
    { title: 'Grève', summary: 'Arrêt de travail organisé; négociations, pressions, compromis.' },
    { title: 'Émeute', summary: 'Explosion de colère collective; dégâts, arrestations, réformes possibles.' },
    { title: 'Procès public', summary: 'Affaire médiatisée; témoins, preuves, verdict.' },
    { title: 'Accident de chantier', summary: 'Blessures, enquêtes, responsabilités, indemnisations.' },
    { title: 'Scandale', summary: 'Révélations compromettantes; chutes de réputation, opportunités pour d’autres.' },
    { title: 'Épidémie locale', summary: 'Maladie qui se propage; mesures, rumeurs, tensions.' },
    { title: 'Découverte d’archives', summary: 'Documents révélés; changements de légitimité, secrets, héritages.' },
    { title: 'Migration', summary: 'Arrivée ou départ massif; pression sur logements, travail, identités.' },
  ];

  for (const e of events) {
    await upsertEvent(e.title, e.summary, null, null, scope);
  }
}

async function seedPerUnivers() {
  const universList = await prisma.universThematique.findMany({
    select: { id: true, name: true },
    orderBy: { id: 'asc' },
  });

  for (const u of universList) {
    const sig = slugMini(u.name);
    const scope: Scoped = { universId: u.id, categorieId: null, cultureId: null };

    const occ = [
      { name: `Opérateur (${sig})`, description: `Spécialiste opérationnel associé à l'univers "${u.name}".` },
      { name: `Analyste (${sig})`, description: `Analyse de données, signaux, tendances propres à "${u.name}".` },
      { name: `Intermédiaire (${sig})`, description: `Négociation, mise en relation, réseaux dans "${u.name}".` },
      { name: `Technicien (${sig})`, description: `Maintenance et dépannage, adapté à "${u.name}".` },
      { name: `Régulateur (${sig})`, description: `Supervision, contrôle, conformité dans "${u.name}".` },
    ];

    for (const o of occ) {
      await upsertOccupation(o.name, o.description, scope);
    }

    const orgs = [
      { name: `Bureau central (${sig})`, type: 'Administration', description: `Coordination et décisions pour "${u.name}".` },
      { name: `Consortium (${sig})`, type: 'Commerce', description: `Acteurs économiques majeurs dans "${u.name}".` },
      { name: `Institut (${sig})`, type: 'Recherche', description: `Recherche et formation liées à "${u.name}".` },
    ];

    for (const org of orgs) {
      await upsertOrganization(org.name, org.type, org.description, scope);
    }

    const ev = [
      { title: `Incident notable (${sig})`, summary: `Un incident qui a marqué l'univers "${u.name}" et ses équilibres.` },
      { title: `Réorganisation majeure (${sig})`, summary: `Changement de structures/pouvoirs dans "${u.name}".` },
      { title: `Découverte déterminante (${sig})`, summary: `Une découverte modifie les pratiques ou les croyances dans "${u.name}".` },
    ];

    for (const e of ev) {
      await upsertEvent(e.title, e.summary, null, null, scope);
    }
  }
}

type ScopedPool = {
  socialClassIds: number[];
  occupationIds: number[];
  organizationIds: number[];
  relationTypeIds: number[];
  eventIds: number[];
};

function pickDeterministic(ids: number[], key: number): number | null {
  if (ids.length === 0) return null;
  const idx = Math.abs(key) % ids.length;
  return ids[idx];
}

async function buildScopedPool(args: {
  universId: number | null;
  categorieId: number | null;
  cultureId: number | null;
}): Promise<ScopedPool> {
  const { universId, categorieId, cultureId } = args;

  const scopedWhere = {
    AND: [
      { OR: [{ universId: null }, ...(universId !== null ? [{ universId }] : [])] },
      { OR: [{ categorieId: null }, ...(categorieId !== null ? [{ categorieId }] : [])] },
      { OR: [{ cultureId: null }, ...(cultureId !== null ? [{ cultureId }] : [])] },
    ],
  };

  const [socialClasses, occupations, organizations, relationTypes, events] = await Promise.all([
    prisma.socialClass.findMany({ where: scopedWhere, select: { id: true }, orderBy: { id: 'asc' } }),
    prisma.occupation.findMany({ where: scopedWhere, select: { id: true }, orderBy: { id: 'asc' } }),
    prisma.organization.findMany({ where: scopedWhere, select: { id: true }, orderBy: { id: 'asc' } }),
    prisma.relationType.findMany({ where: scopedWhere, select: { id: true }, orderBy: { id: 'asc' } }),
    prisma.event.findMany({ where: scopedWhere, select: { id: true }, orderBy: { id: 'asc' } }),
  ]);

  return {
    socialClassIds: socialClasses.map((x) => x.id),
    occupationIds: occupations.map((x) => x.id),
    organizationIds: organizations.map((x) => x.id),
    relationTypeIds: relationTypes.map((x) => x.id),
    eventIds: events.map((x) => x.id),
  };
}

async function seedPersonnageRealismLinks() {
  const personnages = await prisma.personnage.findMany({
    select: {
      id: true,
      socialClassId: true,
      occupationId: true,
      cultureId: true,
      categorieId: true,
      categorie: { select: { universId: true } },
    },
    orderBy: { id: 'asc' },
    take: 500,
  });

  if (personnages.length === 0) {
    console.log('No Personnage rows found. Skipping realism links.');
    return;
  }

  const poolCache = new Map<string, ScopedPool>();
  const getPool = async (universId: number | null, categorieId: number | null, cultureId: number | null) => {
    const k = `${universId ?? 'null'}|${categorieId ?? 'null'}|${cultureId ?? 'null'}`;
    if (poolCache.has(k)) return poolCache.get(k)!;
    const built = await buildScopedPool({ universId, categorieId, cultureId });
    poolCache.set(k, built);
    return built;
  };

  for (const p of personnages) {
    const universId = p.categorie?.universId ?? null;
    const categorieId = p.categorieId ?? null;
    const cultureId = p.cultureId ?? null;
    const pool = await getPool(universId, categorieId, cultureId);

    const socialClassId = p.socialClassId ?? pickDeterministic(pool.socialClassIds, p.id * 7);
    const occupationId = p.occupationId ?? pickDeterministic(pool.occupationIds, p.id * 11);

    if (socialClassId !== p.socialClassId || occupationId !== p.occupationId) {
      await prisma.personnage.update({
        where: { id: p.id },
        data: {
          socialClassId: socialClassId ?? undefined,
          occupationId: occupationId ?? undefined,
        },
      });
    }

    const organizationId = pickDeterministic(pool.organizationIds, p.id * 13);
    if (organizationId !== null) {
      await prisma.personnageOrganization.upsert({
        where: {
          personnageId_organizationId: {
            personnageId: p.id,
            organizationId,
          },
        },
        update: {},
        create: {
          personnageId: p.id,
          organizationId,
          role: 'Membre',
        },
      });
    }

    const eventId = pickDeterministic(pool.eventIds, p.id * 17);
    if (eventId !== null) {
      await prisma.personnageEvent.upsert({
        where: {
          personnageId_eventId: {
            personnageId: p.id,
            eventId,
          },
        },
        update: {},
        create: {
          personnageId: p.id,
          eventId,
          role: 'Participant',
        },
      });
    }
  }

  const relationCandidates = personnages.map((p) => p.id);
  for (let i = 0; i < relationCandidates.length - 1; i++) {
    const fromId = relationCandidates[i];
    const toId = relationCandidates[i + 1];

    const fromPersonnage = personnages[i];
    const pool = await getPool(
      fromPersonnage.categorie?.universId ?? null,
      fromPersonnage.categorieId ?? null,
      fromPersonnage.cultureId ?? null
    );

    const relationTypeId = pickDeterministic(pool.relationTypeIds, fromId * 19 + toId);
    if (relationTypeId === null) continue;

    const existing = await prisma.personnageRelation.findFirst({
      where: {
        fromPersonnageId: fromId,
        toPersonnageId: toId,
        relationTypeId,
      },
      select: { id: true },
    });

    if (!existing) {
      await prisma.personnageRelation.create({
        data: {
          fromPersonnageId: fromId,
          toPersonnageId: toId,
          relationTypeId,
          strength: 50,
        },
      });
    }
  }

  console.log(`Realism links seeded for ${personnages.length} personnages.`);
}

async function main() {
  console.log('Seeding realism: global reference data...');
  await seedGlobal();

  console.log('Seeding realism: per-univers signature packs...');
  await seedPerUnivers();

  console.log('Seeding realism: personnage links (class/job/org/relation/event)...');
  await seedPersonnageRealismLinks();

  console.log('Realism seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
