# PRD - Sezione Archeologi
## Drone Vision Archeology (DVA)

**Versione:** 1.0
**Data:** Gennaio 2026
**Stato:** Demo Locale

---

## 1. Panoramica

### 1.1 Obiettivo
Estendere l'applicazione DVA con una sezione dedicata agli archeologi che permetta di:
- Visualizzare e gestire gli invii di immagini dai piloti di droni
- Analizzare e classificare le immagini per identificare potenziali siti archeologici
- Scartare immagini non rilevanti
- Marcare immagini meritevoli di approfondimento

### 1.2 Contesto
- **Demo locale:** Unico browser che svolge sia il ruolo di pilota che di archeologo
- **Persistenza:** IndexedDB / localStorage condiviso tra le due sezioni
- **Utenti:** Singolo utilizzatore che presenterà l'app al pubblico

---

## 2. Stati del Sistema

### 2.1 Stati di Revisione Immagine
Ogni immagine può trovarsi in uno dei seguenti stati:

| Stato | Descrizione | Color Code |
|-------|-------------|------------|
| **In attesa di revisione** | Stato iniziale quando l'immagine viene inviata dal pilota | Slate-500 |
| **In analisi** | L'archeologo sta attualmente analizzando l'immagine | Amber-500 |
| **Meritevole di approfondimento** | Identificata come potenzialmente interessante per scavi archeologici | Emerald-500 |
| **Non conclusiva** | Necessita di più informazioni o immagini aggiuntive | Blue-500 |
| **Scartata** | Non rilevante, motivata da una delle ragioni predefinite | Red-500 |

### 2.2 Stati di Revisione Invio
Ogni invio (gruppo di immagini) ha uno stato complessivo:

| Stato | Descrizione |
|-------|-------------|
| **In revisione** | Almeno un'immagine dell'invio è ancora "In attesa di revisione" |
| **Completato** | Tutte le immagini sono state classificate (non ci sono più immagini "In attesa") |

---

## 3. Motivi di Scarto

Quando un'immagine viene scartata, deve essere selezionato uno dei seguenti motivi:

1. **Qualità insufficiente** - Foto sfocata, troppo buia, risoluzione bassa
2. **Area già censita/nota** - Già presente nei database archeologici
3. **Falso positivo AI** - L'AI ha rilevato pattern non archeologici
4. **Natura non archeologica** - Strutture moderne, naturali, etc.
5. **Dati insufficienti** - Mancanza coordinate, metadati incompleti

**Campo opzionale:** Commento testuale per aggiungere dettagli aggiuntivi (max 500 caratteri)

---

## 4. Architettura della Sezione Archeologi

### 4.1 Navigazione
- **Switch nell'Header:** Toggle per passare dalla vista "Pilota" a "Archeologo"
- **Rotta dedicata:** `/archeologo` accessibile anche dallo switch

### 4.2 Struttura delle Viste

```
/archeologo
├── Dashboard Lista Invii (ordinati per data, newest first)
│   └── Dettaglio Invio
│       ├── Griglia Immagini (con bulk actions)
│       └── Modale Dettaglio Immagine (zoom, metadati, azioni singole)
```

---

## 5. Vista Dashboard - Lista Invii

### 5.1 Layout
Griglia a card (responsive: 1 colonna mobile, 2 tablet, 3 desktop)

### 5.2 Contenuto Card Invio
```
┌─────────────────────────────────────┐
│ 📍 Area: Roma, Colosseo             │
│ 📅 10 Gen 2026 - 15:30              │
│ 👤 Mario Rossi                      │
│ ─────────────────────────────────── │
│ 📊 12 immagini totali               │
│ ✅ 3 meritevoli                     │
│ ❌ 5 scartate                       │
│ ⏳ 4 in attesa                      │
│ ─────────────────────────────────── │
│ [Badge: In revisione]               │
│ [Visualizza dettagli →]             │
└─────────────────────────────────────┘
```

### 5.3 Dati Visualizzati
- **Location/Area generale:** Ricavata dalle coordinate GPS (reverse geocoding o città più vicina)
- **Data invio:** Data e ora di submit
- **Nome submitter:** Nome fittizio per demo (es. "Mario Rossi", "Luca Verdi")
- **Statistiche immagini:**
  - Totale immagini nell'invio
  - Numero di immagini per stato (meritevoli, scartate, in attesa)
- **Stato complessivo invio:** Badge "In revisione" o "Completato"

### 5.4 Ordinamento
- **Default:** Per data di invio (più recenti prima)
- **Nessun filtro aggiuntivo in questa versione**

### 5.5 Interazioni
- Click su card → Apre il Dettaglio Invio
- Hover effect → Leggero zoom + shadow aumentato

---

## 6. Vista Dettaglio Invio

### 6.1 Layout
```
┌─────────────────────────────────────────────────────────┐
│ ← Torna alla lista     Invio #12345 - Roma, Colosseo   │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  [+] Aggiungi immagini   [Bulk Actions ▾]               │
│                                                           │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                       │
│  │ IMG │ │ IMG │ │ IMG │ │ IMG │                       │
│  │ ✅  │ │ ✅  │ │ ⏳  │ │ ❌  │                       │
│  └─────┘ └─────┘ └─────┘ └─────┘                       │
│                                                           │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                       │
│  │ IMG │ │ IMG │ │ IMG │ │ IMG │                       │
│  │ ⏳  │ │ ⏳  │ │ ❌  │ │ ❌  │                       │
│  └─────┘ └─────┘ └─────┘ └─────┘                       │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Componenti

#### Header
- **Breadcrumb:** "Lista Invii > Dettaglio Invio"
- **Titolo:** Area + Data + Nome submitter
- **Pulsante "Indietro"** per tornare alla lista

#### Griglia Immagini
- **Card immagine:** Preview 200x200px con bordo colorato in base allo stato
- **Checkbox multi-select:** Come nell'editor pilota (Ctrl/Cmd + click)
- **Badge stato:** Icona/color code nell'angolo della card
- **Info overlay:** Data, score AI (se presente)

#### Bulk Actions Toolbar
Visibile solo quando almeno 1 immagine è selezionata:
```
□ 3 selezionati
[Marca come meritevoli] [Scarta] [Cambia stato ▾]
```

### 6.3 Stati Visuali delle Card
- **Selezionata:** Bordo primary (emerald) + shadow + checkmark
- **In attesa:** Bordo slate-500
- **In analisi:** Bordo amber-500
- **Meritevole:** Bordo emerald-500 + icona stella
- **Non conclusiva:** Bordo blue-500
- **Scartata:** Bordo red-500 + icona X + opacità ridotta

---

## 7. Modale Dettaglio Immagine

### 7.1 Trigger
Click su un'immagine nella griglia (senza selezione multipla)

### 7.2 Layout
```
┌────────────────────────────────────────────────────────┐
│ [Chiudi ✕]                                             │
├────────────────────────────────────────────────────────┤
│                                                        │
│           ┌─────────────────┐                          │
│           │                 │                          │
│           │   IMMAGINE      │                          │
│           │   INGRANDITA    │                          │
│           │                 │                          │
│           └─────────────────┘                          │
│                                                        │
├────────────────────────────────────────────────────────┤
│  METADATI                                              │
│  📅 10 Gen 2026 | 📍 41.8902°N, 12.4924°E             │
│  🚁 DJI Mavic 3 | ⛰️ 120m altitudine                  │
│                                                        │
│  AI ANALYSIS                                           │
│  Punteggio fiducia: ████████░░ 85%                    │
│  "Pattern circolari compatibili con strutture..."     │
│  [terreno agricolo] [circonferenze] [forme regolari]  │
│                                                        │
├────────────────────────────────────────────────────────┤
│  AZIONI                                                │
│  Stato corrente: [In attesa di revisione ▾]          │
│                                                        │
│  [⭐ Marca come meritevole]                            │
│  [❌ Scarta]                                           │
│  [🔍 Segna come in analisi]                            │
│  [❓ Non conclusiva]                                    │
│                                                        │
│  [Salva e chiudi] [Precedente] [Successiva]           │
└────────────────────────────────────────────────────────┘
```

### 7.3 Funzionalità
- **Zoom:** Immagine visualizzata a piena risoluzione
- **Navigazione:** Frecce per passare all'immagine precedente/successiva dell'invio
- **Metadati:** Tutti i metadata EXIF + coordinate GPS
- **Analisi AI:** Punteggio fiducia, descrizione, features
- **Azioni singole:** Cambio stato, scarto con motivazione
- **Tasto "Salva e chiudi":** Salva le modifiche e chiude la modale

### 7.4 Modale Scarto
Quando si clicca "Scarta", appare una modale secondaria:
```
┌─────────────────────────────────────────┐
│  Motivo dello scarto                    │
│  ─────────────────────────────────────  │
│  ○ Qualità insufficiente                │
│  ○ Area già censita/nota                │
│  ○ Falso positivo AI                    │
│  ○ Natura non archeologica              │
│  ○ Dati insufficienti                   │
│                                          │
│  Commento (opzionale):                  │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│  0/500 caratteri                       │
│                                          │
│  [Annulla] [Conferma scarto]            │
└─────────────────────────────────────────┘
```

---

## 8. Modale Conferma Bulk Actions

Quando si eseguono azioni su multiple immagini:
```
┌─────────────────────────────────────────┐
│  Conferma azione                         │
│  ─────────────────────────────────────  │
│  Stai per marcare 3 immagini come:      │
│                                          │
│  ★ Meritevoli di approfondimento        │
│                                          │
│  [Annulla] [Conferma]                   │
└─────────────────────────────────────────┘
```

Per lo scarto bulk, appare anche la selezione del motivo (come nella modale singola).

---

## 9. Data Model

### 9.1 Estensione Types
```typescript
// Nuovi tipi da aggiungere a types.ts

export type ImageReviewStatus =
  | 'pending_review'       // In attesa di revisione
  | 'in_analysis'          // In analisi
  | 'worthy_of_review'     // Meritevole di approfondimento
  | 'inconclusive'         // Non conclusiva
  | 'discarded';           // Scartata

export type DiscardReason =
  | 'poor_quality'         // Qualità insufficiente
  | 'already_cataloged'    // Area già censita/nota
  | 'ai_false_positive'    // Falso positivo AI
  | 'not_archaeological'   // Natura non archeologica
  | 'insufficient_data';   // Dati insufficienti

export type SubmissionStatus =
  | 'in_review'            // In revisione
  | 'completed';           // Completato

export interface ImageReviewData {
  status: ImageReviewStatus;
  discardReason?: DiscardReason;
  discardComment?: string;
  reviewedAt?: string;     // ISO timestamp
  reviewedBy?: string;     // Nome archeologo (fake per demo)
}

export interface Submission {
  id: string;
  submitterName: string;
  submittedAt: string;     // ISO timestamp
  images: DroneImage[];    // Array di immagini con reviewData
  status: SubmissionStatus;
  location: {
    area: string;          // Area geografica (es. "Roma, Colosseo")
    coordinates: Coordinates; // Coordinate centrali (media)
  };
}

// Estensione di DroneImage
export interface DroneImage {
  // ... campi esistenti ...
  reviewData?: ImageReviewData;
}
```

### 9.2 Storage Structure
```typescript
// localStorage keys
'dva_submissions'     // Submission[] - Tutti gli invii
'dva_current_user'    // 'pilot' | 'archaeologist' - Vista corrente
'dva_images'          // DroneImage[] - Buffer condiviso (esistente)
```

---

## 10. Flussi Utente

### 10.1 Flusso 1: Creazione Invio (Lato Pilota)
```
1. Pilota carica immagini
2. Pilota edita metadati
3. Pilota esegue analisi AI
4. Pilota clicca "Invia per revisione"
5. Sistema crea un nuovo Submission:
   - ID univoco
   - Submit timestamp
   - Submitter name (random o fake)
   - Location (dalle coordinate GPS)
   - Images con status = 'pending_review'
6. Sistema salva in localStorage['dva_submissions']
7. Sistema mostra vista "Success"
8. Le immagini rimangono accessibili anche al pilota (stesso storage)
```

### 10.2 Flusso 2: Revisione Invio (Lato Archeologo)
```
1. Archeologo switcha alla vista "Archeologo" dall'header
2. Archeologo vede dashboard con lista invii
3. Archeologo clicca su un invio
4. Archeologo vede griglia immagini dell'invio
5. CASO A - Revisione singola:
   a. Clicca su un'immagine
   b. Apre modale dettaglio
   c. Analizza immagine + metadati + AI
   d. Cambia stato o scarta
   e. Salva e chiude
   f. Naviga alla successiva
6. CASO B - Revisione bulk:
   a. Seleziona 3 immagini con Ctrl+click
   b. Clicca "Marca come meritevoli"
   c. Conferma nella modale
   d. Sistema aggiorna le 3 immagini
7. Sistema aggiorna stato Submission se tutte le immagini sono revisionate
```

### 10.3 Flusso 3: Scarto Immagine
```
1. Archeologo seleziona immagine (singola o multipla)
2. Clicca "Scarta"
3. Modale motivazioni:
   - Seleziona motivo da dropdown
   - Aggiunge commento opzionale
4. Conferma
5. Sistema aggiorna:
   - status = 'discarded'
   - discardReason = motivo selezionato
   - discardComment = commento (se presente)
   - reviewedAt = timestamp
6. Sistema aggiorna stato Submission se necessario
```

---

## 11. Specifiche Tecniche

### 11.1 Tech Stack
- **Frontend:** React 19.2.0, TypeScript 5.8.2, Vite 6.2.0
- **Styling:** Tailwind CSS (configurazione esistente)
- **Icons:** Material Symbols Outlined
- **Persistenza:** localStorage (Demo)
- **Maps:** Google Maps API (già integrato)

### 11.2 Nuovi Componenti
```
src/components/
  ├── archaeologist/
  │   ├── ArchaeologistDashboard.tsx      # Lista invii
  │   ├── SubmissionCard.tsx              # Card singolo invio
  │   ├── SubmissionDetail.tsx            # Dettaglio invio + griglia
  │   ├── ImageGrid.tsx                   # Griglia immagini riutilizzabile
  │   ├── ImageCard.tsx                   # Card immagine con stati
  │   ├── ImageDetailModal.tsx            # Modale dettaglio immagine
  │   ├── DiscardModal.tsx                # Modale scarto + motivazioni
  │   ├── BulkActionsToolbar.tsx          # Toolbar azioni bulk
  │   └── ConfirmationModal.tsx           # Modale conferma generica
```

### 11.3 Services
```
src/services/
  ├── submissionService.ts                # CRUD submission
  ├── reviewService.ts                    # Logica revisione stati
  └── geocodingService.ts                 # Reverse geocoding per area
```

### 11.4 Routing
- Rotte attuali: `/` (pilota)
- Nuova rotta: `/archeologo`
- Switch via header: Toggle component che aggiorna `currentView` state

### 11.5 Color Code Mapping
```typescript
const statusColors = {
  pending_review: 'border-slate-500 bg-slate-500/20',
  in_analysis: 'border-amber-500 bg-amber-500/20',
  worthy_of_review: 'border-emerald-500 bg-emerald-500/20',
  inconclusive: 'border-blue-500 bg-blue-500/20',
  discarded: 'border-red-500 bg-red-500/20'
};
```

---

## 12. Design System Coerenza

### 12.1 Palette Colori (Esistente)
- Background: `#0f172a` (Slate 900)
- Surface: `#1e293b` (Slate 800)
- Primary: `#10b981` (Emerald 500)
- Secondary: `#334155` (Slate 700)
- Accent: `#f59e0b` (Amber 500)

### 12.2 Stati Colori (Nuovi)
- **In attesa:** Slate-500 (neutro)
- **In analisi:** Amber-500 (attenzione)
- **Meritevole:** Emerald-500 (positivo)
- **Non conclusiva:** Blue-500 (informazione)
- **Scartata:** Red-500 (negativo)

### 12.3 Typography
- Font: **Space Grotesk** (già in uso)
- Sizes: Stessa gerarchia dell'editor pilota
- Weights: 300, 400, 500, 600, 700

### 12.4 Componenti Riutilizzabili
- Button styles (primary, secondary, danger)
- Input fields (stesso stile border-radius, focus states)
- Cards (stesso border, shadow, hover effects)
- Modals (backdrop, animation, close button)

---

## 13. Accessibility

### 13.1 Keyboard Navigation
- **Tab:** Navigazione tra card e bottoni
- **Enter/Space:** Attivazione elementi
- **Escape:** Chiusura modali
- **Arrow keys:** Navigazione griglia immagini (da implementare in V2)

### 13.2 Screen Reader
- Aria labels su tutti i bottoni icon-only
- Stati annunciati con `aria-label` e `role="status"`
- Modali con `role="dialog"` e focus trap

### 13.3 Color Contrast
- Tutti i testi rispettano ratio WCAG AA (4.5:1)
- Stati indicati con **doppia codifica** (colore + icona)

---

## 14. Performance Considerazioni

### 14.1 Lazy Loading
- Modali caricate on-demand
- Griglia immagini con virtualization se > 100 immagini

### 14.2 Image Optimization
- Thumbnail generation per preview griglia
- Full-res caricata solo in modale dettaglio

### 14.3 localStorage Limits
- Compressione immagini base64 prima di salvare
- Cleanup automatico vecchi invii (> 30 giorni) in produzione (non in demo)

---

## 15. Testing Plan

### 15.1 Unit Tests
- Services (submissionService, reviewService)
- Utility functions (status updates, filters)

### 15.2 Integration Tests
- Flusso completo: pilota → invio → archeologo → revisione
- Persistenza localStorage
- Aggiornamento stati Submission

### 15.3 E2E Scenarios
1. Pilota invia 5 immagini → Archeologo vede nuovo invio in lista
2. Archeologo scarta 2 immagini → Aggiornamento statistiche card
3. Archeologo marca 3 come meritevoli → Invio diventa "Completato"
4. Archeologo riapre invio → Stati preservati

---

## 16. Futuro Enhancements (Out of Scope)

- Analytics dashboard con grafici e heat-map
- Sistema notifiche pilota ↔ archeologo
- Filtri avanzati (per stato, area, score AI)
- Esportazione PDF report invio
- Integrazione con database archeologici reali
- Autenticazione multi-utente
- Commenti threaded per immagine
- Versioning delle revisioni

---

## 17. Delivery Checklist

### Phase 1 - Foundation
- [ ] Data model extension (types.ts)
- [ ] Services implementation (submission, review, geocoding)
- [ ] Header switch component (Pilot ↔ Archaeologist)

### Phase 2 - Views
- [ ] Archaeologist Dashboard (lista invii)
- [ ] Submission Detail (griglia immagini)
- [ ] Image Detail Modal
- [ ] Discard Modal con motivazioni

### Phase 3 - Bulk Actions
- [ ] Multi-select logic
- [ ] Bulk actions toolbar
- [ ] Confirmation modal

### Phase 4 - Polish
- [ ] Animazioni e transitions
- [ ] Loading states
- [ ] Error handling
- [ ] Accessibility audit

### Phase 5 - Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E scenarios
- [ ] User walkthrough demo

---

## 18. Appendice

### 18.1 Mock Data per Demo
```typescript
const mockSubmissions: Submission[] = [
  {
    id: 'sub-001',
    submitterName: 'Mario Rossi',
    submittedAt: '2026-01-10T15:30:00Z',
    images: [/* 12 images */],
    status: 'in_review',
    location: {
      area: 'Roma, Colosseo',
      coordinates: { lat: 41.8902, lng: 12.4924 }
    }
  },
  // ... altri invii
];
```

### 18.2 Reverse Geocoding
Per demo, usare semplificazione:
```typescript
const getAreaFromCoordinates = (coords: Coordinates): string => {
  // Demo: restituisce "Roma, Colosseo" se coordinate vicine
  // In produzione: usare Google Maps Geocoding API
};
```

---

**Documento approvato per implementazione**
