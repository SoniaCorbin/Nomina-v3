import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch, ApiError, getApiBaseUrl } from "../lib/api";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../components/ui/command";
import {
  type Univers, type Categorie, type Culture, type Concept, type SocialClass,
  type Occupation, type Organization, type RelationType, type StoryEvent, type Titre,
  type GenerateResultItem, type GenerateResult, type GenerateWhat,
  GENERATE_OPTIONS, ENDPOINT_MAP, DIRECT_LIST_TYPES,
  getTitreDescription, getItemTitle, getItemDescription, getTypeLabel,
} from "../lib/generate-helpers";

export function GeneratePage() {
  const [loadingInit, setLoadingInit] = useState(true);
  const [loading, setLoading] = useState(false);
  const [univers, setUnivers] = useState<Univers[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [cultures, setCultures] = useState<Culture[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [socialClasses, setSocialClasses] = useState<SocialClass[]>([]);
  const [occupations, setOccupations] = useState<Occupation[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [relationTypes, setRelationTypes] = useState<RelationType[]>([]);
  const [events, setEvents] = useState<StoryEvent[]>([]);
  const [titres, setTitres] = useState<Titre[]>([]);

  const [keywords, setKeywords] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [universId, setUniversId] = useState<number | "">("");
  const [categorieId, setCategorieId] = useState<number | "">("");
  const [cultureId, setCultureId] = useState<number | "">("");
  const [socialClassId, setSocialClassId] = useState<number | "">("");
  const [occupationId, setOccupationId] = useState<number | "">("");
  const [organizationId, setOrganizationId] = useState<number | "">("");
  const [relationTypeId, setRelationTypeId] = useState<number | "">("");
  const [eventId, setEventId] = useState<number | "">("");
  const [conceptId, setConceptId] = useState<number | "">("");
  const [conceptTopic, setConceptTopic] = useState("");
  const [titreId, setTitreId] = useState<number | "">("");
  const [titrePickerOpen, setTitrePickerOpen] = useState(false);
  const [generateWhat, setGenerateWhat] = useState<GenerateWhat>("nomPersonnages");
  const [count, setCount] = useState(10);
  const [genre, setGenre] = useState("");
  const [prefixe, setPrefixe] = useState("");
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<{ url: string; title: string } | null>(null);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const imagePreviewCloseTimer = useRef<number | null>(null);

  // ── Image helpers ──
  function toAbsoluteImageUrl(u?: string | null) {
    if (!u) return null;
    if (u.startsWith("http")) return u;
    return `${getApiBaseUrl()}${u.startsWith("/") ? u : `/${u}`}`;
  }
  function getItemImageUrl(item: GenerateResultItem) {
    return toAbsoluteImageUrl(item?.imageUrl ?? item?.image ?? item?.thumbnailUrl ?? null);
  }
  function openImagePreview(url: string, title: string) {
    if (imagePreviewCloseTimer.current) { clearTimeout(imagePreviewCloseTimer.current); imagePreviewCloseTimer.current = null; }
    setImagePreview({ url, title });
    requestAnimationFrame(() => setImagePreviewOpen(true));
  }
  function closeImagePreview() {
    setImagePreviewOpen(false);
    if (imagePreviewCloseTimer.current) clearTimeout(imagePreviewCloseTimer.current);
    imagePreviewCloseTimer.current = window.setTimeout(() => { setImagePreview(null); imagePreviewCloseTimer.current = null; }, 180);
  }
  useEffect(() => () => { if (imagePreviewCloseTimer.current) clearTimeout(imagePreviewCloseTimer.current); }, []);

  // ── Derived state ──
  const supportsGenre = ["npcs", "nomPersonnages", "fragmentsHistoire", "titres"].includes(generateWhat);
  const supportsCulture = ["npcs", "nomPersonnages", "fragmentsHistoire", "titres"].includes(generateWhat);
  const supportsTitreChoice = ["npcs", "nomPersonnages"].includes(generateWhat);
  const supportsNpcFilters = ["npcs", "nomPersonnages"].includes(generateWhat);

  const filteredCategories = useMemo(() => universId === "" ? categories : categories.filter(c => c.universId === universId), [categories, universId]);
  const filteredConcepts = useMemo(() => categorieId === "" ? concepts : concepts.filter(c => c.categorieId === categorieId), [concepts, categorieId]);

  const filterByScope = <T extends { universId: number | null; categorieId: number | null; cultureId: number | null }>(list: T[]) =>
    list.filter(s => {
      if (universId !== "" && s.universId !== null && s.universId !== universId) return false;
      if (categorieId !== "" && s.categorieId !== null && s.categorieId !== categorieId) return false;
      if (cultureId !== "" && s.cultureId !== null && s.cultureId !== cultureId) return false;
      return true;
    });

  const filteredSocialClasses = useMemo(() => filterByScope(socialClasses), [socialClasses, universId, categorieId, cultureId]);
  const filteredOccupations = useMemo(() => filterByScope(occupations), [occupations, universId, categorieId, cultureId]);
  const filteredOrganizations = useMemo(() => filterByScope(organizations), [organizations, universId, categorieId, cultureId]);
  const filteredRelationTypes = useMemo(() => filterByScope(relationTypes), [relationTypes, universId, categorieId, cultureId]);
  const filteredEvents = useMemo(() => filterByScope(events), [events, universId, categorieId, cultureId]);

  const filteredTitres = useMemo(() => {
    if (!supportsTitreChoice) return [];
    const normalizeG = (raw: string) => {
      const lc = raw.trim().toLowerCase();
      const m = new Set<string>();
      if (["m","masculin","male","homme"].includes(lc)) ["m","masculin","male","homme"].forEach(s=>m.add(s));
      else if (["f","féminin","feminin","female","femme"].includes(lc)) ["f","féminin","feminin","female","femme"].forEach(s=>m.add(s));
      else if (["nb","non-binaire","neutre","neutral"].includes(lc)) ["nb","non-binaire","neutre","neutral"].forEach(s=>m.add(s));
      else m.add(raw.toLowerCase());
      return m;
    };
    const matchesGenre = (tg: string | null | undefined) => { if (!genre || !tg) return true; const w=normalizeG(genre),h=normalizeG(tg); for(const v of h) if(w.has(v)) return true; return false; };
    const allowedCatIds = new Set((universId===""?categories:categories.filter(c=>c.universId===universId)).map(c=>c.id));
    return titres
      .filter(t => { if(categorieId!=="") return (t.categorieId??null)===categorieId; if(universId!=="") return t.categorieId!=null&&allowedCatIds.has(t.categorieId); return true; })
      .filter(t => { if(cultureId==="") return true; return (t.cultureId??null)===cultureId; })
      .filter(t => matchesGenre(t.genre))
      .sort((a,b)=>a.valeur.localeCompare(b.valeur,"fr"));
  }, [supportsTitreChoice, titres, categories, universId, categorieId, cultureId, genre]);

  const filteredTitresGrouped = useMemo(() => {
    const m = new Map<string,Titre[]>();
    for (const t of filteredTitres) { const l=(t.type??"Autres").trim()||"Autres"; m.set(l,[...(m.get(l)??[]),t]); }
    return Array.from(m.entries()).sort(([a],[b])=>a.localeCompare(b,"fr")).map(([label,items])=>({label,items}));
  }, [filteredTitres]);

  const selectedTitre = useMemo(() => titreId==="" ? null : titres.find(t=>t.id===titreId)??null, [titres, titreId]);
  const selectedUnivers = useMemo(() => universId==="" ? null : univers.find(u=>u.id===universId)??null, [univers, universId]);
  const selectedCategorie = useMemo(() => categorieId==="" ? null : categories.find(c=>c.id===categorieId)??null, [categories, categorieId]);
  const selectedCulture = useMemo(() => cultureId==="" ? null : cultures.find(c=>c.id===cultureId)??null, [cultures, cultureId]);
  const selectedConcept = useMemo(() => conceptId==="" ? null : concepts.find(c=>c.id===conceptId)??null, [concepts, conceptId]);
  const categoryNameById = useMemo(() => new Map(categories.map(c=>[c.id,c.name])), [categories]);
  const cultureNameById = useMemo(() => new Map(cultures.map(c=>[c.id,c.name])), [cultures]);
  const titreDescById = useMemo(() => new Map(titres.map(t=>[t.id,getTitreDescription(t)])), [titres]);
  const selectedTitreDesc = useMemo(() => selectedTitre ? (titreDescById.get(selectedTitre.id) ?? getTitreDescription(selectedTitre)) : null, [selectedTitre, titreDescById]);

  // ── Data loading ──
  useEffect(() => {
    let c = false;
    async function fetchFb<T>(paths: string[], def: T): Promise<T> { for (const p of paths) { try { return await apiFetch<T>(p); } catch(e) { if(e instanceof ApiError && e.status===404) continue; throw e; } } return def; }
    (async () => {
      setLoadingInit(true); setError(null);
      try {
        const s = await Promise.allSettled([
          apiFetch<Univers[]>("/univers"), apiFetch<Categorie[]>("/categories"), apiFetch<Culture[]>("/cultures"),
          apiFetch<Concept[]>("/concepts"), apiFetch<Titre[]>("/titres"),
          fetchFb<SocialClass[]>(["/socialClasses","/socialclasses"],[]),
          fetchFb<Occupation[]>(["/occupations"],[]),
          fetchFb<Organization[]>(["/organizations"],[]),
          fetchFb<RelationType[]>(["/relationTypes","/relationtypes"],[]),
          fetchFb<StoryEvent[]>(["/events"],[]),
        ]);
        if(c)return;
        const [u,ca,cu,co,t,sc,oc,og,rt,ev]=s;
        const unwrap = (v: unknown) => Array.isArray(v) ? v : (v as any)?.data ?? [];

        if(u.status==="fulfilled")  setUnivers(unwrap(u.value));
        if(ca.status==="fulfilled") setCategories(unwrap(ca.value));
        if(cu.status==="fulfilled") setCultures(unwrap(cu.value));
        if(co.status==="fulfilled") setConcepts(unwrap(co.value));
        if(t.status==="fulfilled")  setTitres(unwrap(t.value));
        if(sc.status==="fulfilled") setSocialClasses(unwrap(sc.value));
        if(oc.status==="fulfilled") setOccupations(unwrap(oc.value));
        if(og.status==="fulfilled") setOrganizations(unwrap(og.value));
        if(rt.status==="fulfilled") setRelationTypes(unwrap(rt.value));
        if(ev.status==="fulfilled") setEvents(unwrap(ev.value));

        const fails=s.filter(x=>x.status==="rejected").length;
        if(fails===s.length) setError("Impossible de joindre l'API.");
        else if(fails>0) setError("Certaines listes n'ont pas pu être chargées.");
      } catch(e) { if(!c) setError(e instanceof ApiError?`${e.message} (HTTP ${e.status})`:String(e)); }
      finally { if(!c) setLoadingInit(false); }
    })();
    return ()=>{c=true;};
  }, []);

  useEffect(()=>{setCategorieId("");setConceptId("");setConceptTopic("");setTitreId("");},[universId]);
  useEffect(()=>{setConceptId("");setTitreId("");},[categorieId]);
  useEffect(()=>{setTitreId("");},[cultureId,genre,generateWhat]);
  useEffect(()=>{if(generateWhat!=="concepts")setConceptTopic("");},[generateWhat]);

  // ── Generate ──
  async function onGenerate() {
    setLoading(true); setError(null); setResult(null);
    const safeCount = Number.isFinite(count) ? Math.max(1,Math.min(200,Math.trunc(count))) : 10;
    try {
      const trimKw = keywords.trim();
      if (DIRECT_LIST_TYPES.has(generateWhat)) {
        const ep = generateWhat==="categories"?"/categories":generateWhat==="cultures"?"/cultures":generateWhat==="universThematique"?"/univers":"/creatures";
        const data = await apiFetch<GenerateResultItem[]>(ep);
        const kwList = trimKw ? trimKw.split(/[,;|]/g).map(k=>k.trim().toLowerCase()).filter(Boolean) : [];
        const filtered = kwList.length>0 ? data.filter(item=>{const h=[String(item?.name??""),String(item?.description??""),String(item?.type??"")].join(" ").toLowerCase(); return kwList.some(kw=>h.includes(kw));}) : data;
        const src = filtered.length>0?filtered:data;
        setResult({ seed:"direct", count:Math.min(src.length,safeCount), filters:{keywords:trimKw||null}, items:src.slice(0,safeCount),
          info: kwList.length>0 ? (filtered.length>0?`${filtered.length} éléments trouvés`:`Aucun match, suggestions affichées`) : `${data.length} éléments`,
          warning: src.length===0?"Aucun résultat.":kwList.length>0&&filtered.length===0?`Aucun match pour "${trimKw}".`:undefined });
        setLoading(false); return;
      }
      const qs = new URLSearchParams(); qs.set("count",String(safeCount));
      if(prefixe.trim()) qs.set("seed",prefixe.trim());
      if(trimKw) qs.set("keywords",trimKw);
      if(supportsGenre&&genre) qs.set("genre",genre);
      if(cultureId!==""&&supportsCulture) qs.set("cultureId",String(cultureId));
      if(categorieId!=="") qs.set("categorieId",String(categorieId));
      if(supportsNpcFilters) {
        if(socialClassId!=="") qs.set("socialClassId",String(socialClassId));
        if(occupationId!=="") qs.set("occupationId",String(occupationId));
        if(organizationId!=="") qs.set("organizationId",String(organizationId));
        if(relationTypeId!=="") qs.set("relationTypeId",String(relationTypeId));
        if(eventId!=="") qs.set("eventId",String(eventId));
      }
      if(generateWhat==="concepts") { const t=conceptTopic.trim(); if(t) qs.set("topic",t); else if(conceptId!=="") qs.set("conceptId",String(conceptId)); }
      if(["npcs","nomPersonnages","fragmentsHistoire"].includes(generateWhat)&&universId!=="") qs.set("universId",String(universId));
      if(supportsTitreChoice&&titreId!=="") qs.set("titreId",String(titreId));
      const data = await apiFetch<GenerateResult>(`${ENDPOINT_MAP[generateWhat]}?${qs}`);
      setResult(data);
    } catch(e) { setError(e instanceof ApiError?`${e.message} (HTTP ${e.status})`:String(e)); }
    finally { setLoading(false); }
  }

  const selectCls = "w-full h-9 rounded-lg border border-rule bg-velin px-3 text-sm text-ink focus:outline-none focus:border-wax focus:ring-1 focus:ring-wax/30";
  const inputCls = "w-full border border-rule rounded-lg bg-velin px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-wax focus:ring-1 focus:ring-wax/30";
  const labelCls = "font-mono text-[9.5px] tracking-wide uppercase text-ink-3 block mb-1.5";

  return (
    <main className="min-h-screen p-6 bg-paper">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <h1 className="font-heading text-3xl text-ink">Génération</h1>
            <p className="text-ink-3 text-sm mt-1">Décris un monde, choisis quoi en tirer.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {/* ── Formulaire ── */}
          <div className="bg-velin border border-rule rounded-2xl p-5 space-y-4">
            {loadingInit && <p className="text-ink-3 text-sm">Chargement des listes…</p>}

            {/* Mots-clés */}
            <div>
              <label className={labelCls}>Décris ce que tu veux</label>
              <input
                value={keywords} onChange={e=>setKeywords(e.target.value)}
                placeholder="dragon, montagne, ancien, mystère"
                className={`${inputCls} border-wax border-[1.5px] shadow-[0_0_0_4px_var(--wax-soft)]`}
              />
              <p className="text-[11px] text-ink-3 mt-1.5">Des mots-clés séparés par des virgules. On cherche d'abord dans la base, puis on invente si besoin.</p>
            </div>

            {/* Type */}
            <div>
              <label className={labelCls}>Quoi générer</label>
              <div className="flex flex-wrap gap-2">
                {GENERATE_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={()=>setGenerateWhat(opt.value)}
                    className={`inline-flex items-center gap-1.5 border rounded-lg px-3 py-2 text-[13px] transition-colors ${
                      generateWhat===opt.value
                        ? "border-wax bg-wax-soft text-wax font-semibold"
                        : "border-rule bg-white text-ink-2"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Combien + Genre */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Combien</label>
                <div className="flex items-center border border-rule rounded-lg bg-white overflow-hidden">
                  <button className="px-3 py-2 text-ink-3 border-r border-rule" onClick={()=>setCount(c=>Math.max(1,c-1))}>−</button>
                  <input type="number" min={1} max={200} value={count} onChange={e=>{const n=Number(e.target.value); setCount(Number.isFinite(n)?Math.max(1,Math.min(200,Math.trunc(n))):1);}}
                    className="flex-1 text-center text-sm text-ink bg-transparent py-2 focus:outline-none" />
                  <button className="px-3 py-2 text-ink-3 border-l border-rule" onClick={()=>setCount(c=>Math.min(200,c+1))}>+</button>
                </div>
              </div>
              {supportsGenre && (
                <div>
                  <label className={labelCls}>Genre</label>
                  <select value={genre} onChange={e=>setGenre(e.target.value)} className={selectCls}>
                    <option value="">Tous</option>
                    <option value="homme">Masculin</option>
                    <option value="femme">Féminin</option>
                    <option value="creature">Créature</option>
                    <option value="neutre">Neutre</option>
                  </select>
                </div>
              )}
            </div>

            {/* Filtres avancés */}
            <div className="border-t border-rule pt-3">
              <button onClick={()=>setShowAdvancedFilters(!showAdvancedFilters)} className="text-sm text-ink-3 hover:text-ink flex items-center gap-2">
                <span className="text-rule-2">{showAdvancedFilters?"▾":"▸"}</span>
                Filtres avancés <span className="text-ink-3/60">— univers, culture, classe sociale, métier…</span>
              </button>
              {showAdvancedFilters && (
                <div className="grid gap-3 mt-3">
                  <Select label="Univers" value={universId} onChange={v=>setUniversId(v?Number(v):"")} options={univers.map(u=>({value:u.id,label:u.name}))} />
                  <Select label="Catégorie" value={categorieId} onChange={v=>setCategorieId(v?Number(v):"")} options={filteredCategories.map(c=>({value:c.id,label:c.name}))} />
                  {supportsCulture && <Select label="Culture" value={cultureId} onChange={v=>setCultureId(v?Number(v):"")} options={cultures.map(c=>({value:c.id,label:c.name}))} />}
                  {supportsNpcFilters && <>
                    <Select label="Classe sociale" value={socialClassId} onChange={v=>setSocialClassId(v?Number(v):"")} options={filteredSocialClasses.map(s=>({value:s.id,label:s.name}))} />
                    <Select label="Métier" value={occupationId} onChange={v=>setOccupationId(v?Number(v):"")} options={filteredOccupations.map(o=>({value:o.id,label:o.name}))} />
                    <Select label="Organisation" value={organizationId} onChange={v=>setOrganizationId(v?Number(v):"")} options={filteredOrganizations.map(o=>({value:o.id,label:o.name}))} />
                    <Select label="Relation" value={relationTypeId} onChange={v=>setRelationTypeId(v?Number(v):"")} options={filteredRelationTypes.map(r=>({value:r.id,label:r.label}))} />
                    <Select label="Événement" value={eventId} onChange={v=>setEventId(v?Number(v):"")} options={filteredEvents.map(e=>({value:e.id,label:e.title}))} />
                  </>}
                  {generateWhat==="concepts" && (
                    <div><label className={labelCls}>Sujet</label><input value={conceptTopic} onChange={e=>{setConceptTopic(e.target.value);if(e.target.value.trim())setConceptId("");}} placeholder="Ex: chaussures, café…" className={inputCls} /></div>
                  )}
                  {supportsTitreChoice && (
                    <div>
                      <label className={labelCls}>Titre</label>
                      <Popover open={titrePickerOpen} onOpenChange={setTitrePickerOpen}>
                        <PopoverTrigger asChild>
                          <button className="w-full flex justify-between items-center border border-rule rounded-lg bg-white px-3 py-2 text-sm text-ink">
                            <span className="truncate">{selectedTitre?.valeur??"— Aucun —"}</span>
                            <span className="text-rule-2 ml-2">⌄</span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[340px] p-0 bg-ink border border-rule-2 shadow-lg z-50" align="start">
                          <Command className="bg-ink">
                            <CommandInput placeholder="Rechercher…" className="bg-ink text-velin border-b border-rule-2" />
                            <CommandList>
                              <CommandEmpty>Aucun titre.</CommandEmpty>
                              <CommandGroup>
                                <CommandItem value="__none__" onSelect={()=>{setTitreId("");setTitrePickerOpen(false);}} className="!text-ink hover:bg-velin"
                                >
                                  — Aucun — 
                                </CommandItem>
                              </CommandGroup>
                              {filteredTitresGrouped.map(g=>(
                                <CommandGroup key={g.label} heading={g.label}>
                                  {g.items.map(t=>(
                                    <CommandItem key={t.id} value={`${t.valeur} ${g.label}`} onSelect={()=>{setTitreId(t.id);setTitrePickerOpen(false);}} className="!text-ink hover:bg-velin">
                                      <div className="flex flex-col"><span className="truncate">{t.valeur}</span><span className="text-xs text-ink-3 truncate">{titreDescById.get(t.id)??getTitreDescription(t)}</span></div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              ))}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {selectedTitreDesc && <p className="mt-1 text-xs text-ink-3">{selectedTitreDesc}</p>}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Préfixe */}
            <div>
              <label className={labelCls}>Préfixe (seed)</label>
              <input value={prefixe} onChange={e=>setPrefixe(e.target.value)} placeholder="Ael · Nova · Val" className={inputCls} />
            </div>

            <button onClick={onGenerate} disabled={loading||loadingInit}
              className="w-full bg-wax hover:bg-wax-hover text-velin rounded-lg py-3 text-[15px] font-semibold transition-colors disabled:opacity-50">
              {loading?"Génération…":"Générer"}
            </button>
            {error && <p className="text-crit text-sm">{error}</p>}
          </div>

          {/* ── Résultats ── */}
          <div>
            {result ? (
              <div>
                <div className="flex items-baseline gap-3 mb-3">
                  <h2 className="font-heading text-xl text-ink">Créations</h2>
                  <span className="font-mono text-[10px] text-ink-3">{result.count??result.items?.length??0} {getTypeLabel(generateWhat).toLowerCase()}</span>
                </div>

                {/* Filtres actifs */}
                {(selectedUnivers||selectedCategorie||selectedCulture||genre||selectedTitre) && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {selectedUnivers && <span className="bg-paper-2 text-ink-3 rounded px-2 py-0.5 text-[11px]">Univers : {selectedUnivers.name}</span>}
                    {selectedCategorie && <span className="bg-paper-2 text-ink-3 rounded px-2 py-0.5 text-[11px]">Cat. : {selectedCategorie.name}</span>}
                    {selectedCulture && <span className="bg-paper-2 text-ink-3 rounded px-2 py-0.5 text-[11px]">Culture : {selectedCulture.name}</span>}
                    {genre && <span className="bg-paper-2 text-ink-3 rounded px-2 py-0.5 text-[11px]">Genre : {genre}</span>}
                    {selectedTitre && <span className="bg-ink-2/20 text-velin/70 rounded px-2 py-0.5 text-[11px]">Titre : {selectedTitre.valeur}</span>}
                  </div>
                )}

                {result.warning && (
                  <div className="bg-warn-bg border-l-[3px] border-warn text-warn px-4 py-2.5 rounded-r-md mb-3 text-sm">{result.warning}</div>
                )}

                {Array.isArray(result.items)&&result.items.length>0 ? (
                  <div className="max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                    <div className={`grid gap-3 ${generateWhat==="fragmentsHistoire"?"sm:grid-cols-1 xl:grid-cols-2":generateWhat==="titres"?"sm:grid-cols-1 lg:grid-cols-2":"sm:grid-cols-2"}`}>
                      {result.items.map((item,idx) => {
                        const title = getItemTitle(item,generateWhat);
                        const desc = getItemDescription(item,generateWhat);
                        const imgUrl = getItemImageUrl(item);
                        return (
                          <div key={idx} className={`bg-velin border border-rule rounded-xl p-4 hover:border-rule-2 transition-colors ${imgUrl?"cursor-pointer":""}`}
                            onClick={()=>{if(imgUrl)openImagePreview(imgUrl,title);}}>
                            <div className="font-heading text-lg text-ink">{title}</div>
                            <span className="inline-block mt-1.5 mb-2 font-mono text-[9.5px] tracking-wide uppercase text-wax bg-wax-soft rounded px-2 py-0.5">
                              {getTypeLabel(generateWhat)}
                            </span>
                            <p className={`text-[12.5px] text-ink-2 leading-relaxed ${generateWhat==="npcs"?"max-h-40 overflow-y-auto":""}`}>{desc}</p>
                            {(item.type||item.cultureId||item.categorieId) && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {item.type && <span className="bg-paper-2 text-ink-3 rounded px-2 py-0.5 text-[10px]">{item.type}</span>}
                                {item.cultureId && <span className="bg-paper-2 text-ink-blue rounded px-2 py-0.5 text-[10px]">{cultureNameById.get(item.cultureId)??`#${item.cultureId}`}</span>}
                                {item.categorieId && <span className="bg-paper-2 text-ink-3 rounded px-2 py-0.5 text-[10px]">{categoryNameById.get(item.categorieId)??`#${item.categorieId}`}</span>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="w-9 h-9 border border-rule-2 rounded-full mx-auto mb-3 flex items-center justify-center font-heading text-lg text-ink-3">N</div>
                    <div className="font-heading text-lg text-ink">Rien encore généré</div>
                    <p className="text-[12.5px] text-ink-3 mt-1">Choisis un type, lance la génération — les résultats apparaissent ici.</p>
                  </div>
                )}

                {/* Dev mode */}
                <details className="mt-5 border-t border-rule pt-3">
                  <summary className="text-sm text-ink-blue cursor-pointer hover:underline font-medium">Développeur — JSON brut</summary>
                  <pre className="bg-ink text-ink-blue p-4 rounded-lg overflow-auto text-xs mt-2 max-h-80 font-mono">{JSON.stringify(result,null,2)}</pre>
                </details>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-9 h-9 border border-rule-2 rounded-full mx-auto mb-3 flex items-center justify-center font-heading text-lg text-ink-3">N</div>
                <div className="font-heading text-lg text-ink">Prêt à créer</div>
                <p className="text-[12.5px] text-ink-3 mt-1">Décris ton monde, choisis le type, et génère.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image preview modal */}
      {imagePreview && (
        <div className={`fixed inset-0 z-50 bg-ink/70 flex items-center justify-center p-4 transition-opacity duration-200 ${imagePreviewOpen?"opacity-100":"opacity-0"}`} onClick={closeImagePreview}>
          <div className={`relative bg-velin rounded-lg max-w-4xl w-full p-3 transition-all duration-200 ${imagePreviewOpen?"opacity-100 scale-100":"opacity-0 scale-95"}`} onClick={e=>e.stopPropagation()}>
            <button onClick={closeImagePreview} className="absolute right-3 top-3 bg-ink/70 text-paper rounded-full w-8 h-8 flex items-center justify-center" aria-label="Fermer">✕</button>
            <img src={imagePreview.url} alt={imagePreview.title} className="w-full max-h-[80vh] object-contain rounded-md" />
            <p className="mt-2 text-sm text-ink text-center">{imagePreview.title}</p>
          </div>
        </div>
      )}
    </main>
  );
}

/* ── Select helper ── */
function Select({ label, value, onChange, options }: { label: string; value: number|""; onChange: (v:string)=>void; options: {value:number;label:string}[] }) {
  return (
    <div>
      <label className="font-mono text-[9.5px] tracking-wide uppercase text-ink-3 block mb-1.5">{label}</label>
      <select value={value} onChange={e=>onChange(e.target.value)} className="w-full h-9 rounded-lg border border-rule bg-velin px-3 text-sm text-ink focus:outline-none focus:border-wax focus:ring-1 focus:ring-wax/30">
        <option value="">— Tous —</option>
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}