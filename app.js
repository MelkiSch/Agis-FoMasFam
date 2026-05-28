// AGIS FoMasFam Finder - Application Controller

// State Management
let postings = [];
let selectedRegion = "";
let selectedType = "All"; // All, FO, MAS, FAM
let selectedStatus = "";
let selectedPriority = "";
let searchQuery = "";
let currentActiveLeadId = null;
let isScanning = false;
let scanInterval = null;

// Template variables for emails/messages in French
const emailTemplates = {
  "request-info": (lead) => `Objet : Demande de renseignements - Recherche de place en ${lead.type} - ${lead.familyMember}

Bonjour ${lead.contactName || "Madame, Monsieur"},

J'ai pris connaissance de votre message concernant votre recherche active d'une place en ${lead.type} (${
    lead.type === "MAS" ? "Maison d'Accueil Spécialisée" : lead.type === "FAM" ? "Foyer d'Accueil Médicalisé" : "Foyer de Vie / Foyer Occupationnel"
  }) en région ${lead.region} pour votre proche ${lead.familyMember} (${lead.age} ans, ${lead.handicap || "en situation de handicap"}).

Nous accompagnons les familles dans l'activation de leurs dossiers d'admissions. Pourriez-vous nous préciser :
1. Si l'orientation MDPH correspondante est bien en cours de validité ?
2. Si vous avez déjà constitué et déposé des dossiers sur la plateforme ViaTrajectoire ?
3. Quels sont vos critères géographiques spécifiques au sein de la région ?

Dans l'attente de votre retour pour vous aider au mieux.

Bien cordialement,
[Votre Nom / AGIS Coordination]`,

  "spot-available": (lead) => `Objet : Signalement opportunité de place - ${lead.type} - ${lead.familyMember}

Bonjour ${lead.contactName || "Madame, Monsieur"},

Nous faisons suite à votre post de recherche de place en ${lead.type} pour ${lead.familyMember}.

Un établissement de notre réseau en région ${lead.region} vient de nous signaler une disponibilité ou une possibilité d'accueil temporaire susceptible de correspondre à son profil (${lead.handicap || "besoins spécifiques"}).

Nous vous invitons à nous recontacter au plus vite afin que nous puissions faire le point sur le dossier de ${lead.familyMember} et, le cas échéant, vous mettre en relation directe avec la direction de cet établissement.

Bien cordialement,
[Votre Nom / AGIS Coordination]`,

  "support-offer": (lead) => `Objet : Proposition d'accompagnement - Recherche ${lead.type} - ${lead.familyMember}

Bonjour ${lead.contactName || "Madame, Monsieur"},

Je me permets de vous contacter suite à votre message exprimant vos difficultés à trouver une place en ${lead.type} pour ${lead.familyMember}.

Nous savons à quel point le parcours administratif et l'attente peuvent être complexes et épuisants pour les aidants familiaux. Si vous le souhaitez, l'équipe d'AGIS peut vous proposer un accompagnement gratuit pour :
- Relancer l'ARS (Agence Régionale de Santé) locale au titre de la cellule de cas complexes.
- Optimiser et mettre à jour vos demandes sur ViaTrajectoire.
- Rédiger des courriers d'appui de votre recherche.

N'hésitez pas à nous indiquer vos disponibilités pour un échange téléphonique.

Bien cordialement,
[Votre Nom / AGIS Coordination]`
};

// Newly generated crawled items templates for the simulation
const simulatedNewLeads = [
  {
    type: "FO",
    priority: "Medium",
    region: "Occitanie",
    title: "Recherche Foyer de Vie / Accueil de jour - Léa, 24 ans (Trisomie 21)",
    description: "Recherche active d'un accueil de jour ou foyer de vie dans l'Hérault pour Léa, 24 ans. Elle aime l'équitation, la danse et la cuisine. Elle est très sociale et autonome. Dossier MDPH validé.",
    handicap: "Trisomie 21",
    age: 24,
    familyMember: "Léa",
    contactName: "Nadine Dubois (Mère)",
    contactPhone: "+33 6 54 87 21 09",
    contactEmail: "nadine.dubois34@orange.fr",
    contactSocial: "https://www.facebook.com/groups/trisomie.herault/posts/44589201"
  },
  {
    type: "MAS",
    priority: "High",
    region: "Bourgogne-Franche-Comté",
    title: "Recherche place MAS médicalisée - Nicolas, 38 ans",
    description: "Recherche très urgente en MAS pour Nicolas, 38 ans, autisme lourd avec troubles du comportement associés et automutilation. Suite à l'hospitalisation de sa maman aidante, il n'y a plus de relais possible à domicile. Notification MAS prioritaire de l'ARS en cours.",
    handicap: "Autisme Sévère / TSA",
    age: 38,
    familyMember: "Nicolas",
    contactName: "Jean-Marc Pautet (Oncle / Tuteur)",
    contactPhone: "+33 3 80 12 98 76",
    contactEmail: "jm.pautet.tuteur@gmail.com",
    contactSocial: "https://www.facebook.com/groups/aidants.bourgogne/posts/99182763"
  },
  {
    type: "FAM",
    priority: "Medium",
    region: "Hauts-de-France",
    title: "Demande FAM avec prise en charge autisme - Maxime, 26 ans",
    description: "Mon fils Maxime, 26 ans, est actuellement en IME en amendement Creton dans la Somme. L'IME nous demande de trouver une structure adulte pour la fin de l'année. Nous recherchons un Foyer d'Accueil Médicalisé spécialisé autisme.",
    handicap: "Autisme (TSA)",
    age: 26,
    familyMember: "Maxime",
    contactName: "Hervé Fontaine (Père)",
    contactPhone: "+33 6 88 77 66 55",
    contactEmail: "h.fontaine.somme@sfr.fr",
    contactSocial: "https://forum.doctissimo.fr/sante/handicap/recherche-fam-somme-sujet_3829.htm"
  },
  {
    type: "MAS",
    priority: "High",
    region: "Île-de-France",
    title: "Urgence: Suite à rupture de contrat belge - Manon, 21 ans (Polyhandicap)",
    description: "Notre fille Manon doit quitter son centre en Belgique suite à une modification des critères d'admissibilité transfrontalière. Nous recherchons d'urgence une place en Maison d'Accueil Spécialisée (MAS) en Seine-et-Marne (77).",
    handicap: "Polyhandicap physique et cognitif",
    age: 21,
    familyMember: "Manon",
    contactName: "Gérard Vallet (Père)",
    contactPhone: "+33 1 64 23 87 56",
    contactEmail: "gerard.vallet@hotmail.com",
    contactSocial: "https://www.facebook.com/groups/retour-belgique-idf/posts/882910"
  }
];

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  // Load data from LocalStorage or initialize with seed data
  const storedPostings = localStorage.getItem("agis_fomasfam_postings");
  if (storedPostings) {
    try {
      postings = JSON.parse(storedPostings);
    } catch (e) {
      console.error("Failed to parse stored postings, resetting database.", e);
      postings = [...initialPostings];
      localStorage.setItem("agis_fomasfam_postings", JSON.stringify(postings));
    }
  } else {
    postings = [...initialPostings];
    localStorage.setItem("agis_fomasfam_postings", JSON.stringify(postings));
  }

  // Setup wizard search query links
  setupSearchWizardLinks();

  // Initial Render calls
  renderAll();

  // Register main navigation listeners
  setupNavigation();

  // Register map listeners
  setupMapListeners();

  // Register filters and search listeners
  setupFilterListeners();

  // Register action buttons (add lead, import/export)
  setupActionButtons();

  // Register drawer listeners (close, note saves, status updates, activation)
  setupDrawerListeners();

  // Register modal form listeners
  setupModalFormListeners();

  // Register crawler scan trigger
  setupScanTrigger();
});

// Setup links dynamically for external manual search helpers
function setupSearchWizardLinks() {
  const googleBtn = document.getElementById("wizard-google");
  const facebookBtn = document.getElementById("wizard-facebook");
  const doctissimoBtn = document.getElementById("wizard-doctissimo");

  const queryGoogle = `site:facebook.com OR site:doctissimo.fr OR site:forum.apf-francehandicap.org "place en MAS" OR "recherche FAM" OR "place Foyer de Vie" handicap`;
  googleBtn.href = `https://www.google.com/search?q=${encodeURIComponent(queryGoogle)}`;

  const queryFacebook = `"place en MAS" OR "recherche FAM" OR "place Foyer de Vie" handicap`;
  facebookBtn.href = `https://www.facebook.com/search/posts/?q=${encodeURIComponent(queryFacebook)}`;

  const queryDoctissimo = `site:forum.doctissimo.fr handicap foyer de vie OR MAS OR FAM`;
  doctissimoBtn.href = `https://www.google.com/search?q=${encodeURIComponent(queryDoctissimo)}`;
}

// Navigation Views switcher
function setupNavigation() {
  const navDashboard = document.getElementById("nav-dashboard");
  const navLeads = document.getElementById("nav-leads");
  
  const viewDashboard = document.getElementById("view-dashboard");
  const viewAllLeads = document.getElementById("view-all-leads");
  
  const viewTitle = document.getElementById("current-view-title");

  navDashboard.addEventListener("click", () => {
    navDashboard.classList.add("active");
    navLeads.classList.remove("active");
    viewDashboard.classList.remove("hidden");
    viewAllLeads.classList.add("hidden");
    viewTitle.textContent = "Tableau de Bord";
  });

  navLeads.addEventListener("click", () => {
    navDashboard.classList.remove("active");
    navLeads.classList.add("active");
    viewDashboard.classList.add("hidden");
    viewAllLeads.classList.remove("hidden");
    viewTitle.textContent = "Base de Données Complète";
    
    // In this view, we remove all filters to show everything, or keep the existing ones
    // We will render the full table/grid view
    renderFullTable();
  });
}

// Interactive SVG Map Event Listeners
function setupMapListeners() {
  const paths = document.querySelectorAll("svg#france-map path");
  const tooltip = document.getElementById("map-tooltip");
  const clearMapFilterIndicator = document.getElementById("map-filter-indicator");
  const mapFilteredRegionSpan = document.getElementById("map-filtered-region");

  paths.forEach(path => {
    // Click: Toggle region filter
    path.addEventListener("click", () => {
      const region = path.getAttribute("data-region");
      
      if (selectedRegion === region) {
        selectedRegion = "";
        paths.forEach(p => p.classList.remove("selected"));
        clearMapFilterIndicator.style.display = "none";
        showToast("Filtre régional retiré", "info");
      } else {
        selectedRegion = region;
        paths.forEach(p => p.classList.remove("selected"));
        path.classList.add("selected");
        
        // Show indicator
        clearMapFilterIndicator.style.display = "inline-flex";
        mapFilteredRegionSpan.textContent = region;
        
        // Sync the drop-down filter
        document.getElementById("filter-region").value = region;
        
        showToast(`Filtre région : ${region}`, "info");
      }
      
      renderAll();
    });

    // Hover tooltip
    path.addEventListener("mousemove", (e) => {
      const region = path.getAttribute("data-region");
      const regionCount = postings.filter(p => p.region === region && p.status !== "Closed" && p.status !== "Spot Secured").length;
      
      tooltip.innerHTML = `<strong>${region}</strong><br>${regionCount} recherche(s) active(s)`;
      tooltip.style.opacity = "1";
      
      // Position tooltip relative to container
      const containerRect = document.querySelector(".map-container").getBoundingClientRect();
      tooltip.style.left = `${e.clientX - containerRect.left + 15}px`;
      tooltip.style.top = `${e.clientY - containerRect.top + 15}px`;
    });

    path.addEventListener("mouseleave", () => {
      tooltip.style.opacity = "0";
    });
  });

  // Clear map filter indicator click
  clearMapFilterIndicator.addEventListener("click", () => {
    selectedRegion = "";
    paths.forEach(p => p.classList.remove("selected"));
    clearMapFilterIndicator.style.display = "none";
    document.getElementById("filter-region").value = "";
    renderAll();
    showToast("Filtre régional retiré", "info");
  });
}

// Global Filter dropdowns and type tab controls
function setupFilterListeners() {
  const filterRegion = document.getElementById("filter-region");
  const filterStatus = document.getElementById("filter-status");
  const filterPriority = document.getElementById("filter-priority");
  const globalSearchInput = document.getElementById("global-search-input");
  const btnClearFilters = document.getElementById("btn-clear-filters");

  // Filter dropdown listeners
  filterRegion.addEventListener("change", (e) => {
    selectedRegion = e.target.value;
    
    // Highlight region on map
    const paths = document.querySelectorAll("svg#france-map path");
    paths.forEach(p => {
      if (p.getAttribute("data-region") === selectedRegion) {
        p.classList.add("selected");
        document.getElementById("map-filter-indicator").style.display = "inline-flex";
        document.getElementById("map-filtered-region").textContent = selectedRegion;
      } else {
        p.classList.remove("selected");
      }
    });

    if (!selectedRegion) {
      document.getElementById("map-filter-indicator").style.display = "none";
    }

    renderAll();
  });

  filterStatus.addEventListener("change", (e) => {
    selectedStatus = e.target.value;
    renderAll();
  });

  filterPriority.addEventListener("change", (e) => {
    selectedPriority = e.target.value;
    renderAll();
  });

  // Global search input
  globalSearchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderAll();
  });

  // Facility Type tabs (All, FO, MAS, FAM)
  const tabs = [
    { id: "tab-all", value: "All" },
    { id: "tab-fo", value: "FO" },
    { id: "tab-mas", value: "MAS" },
    { id: "tab-fam", value: "FAM" }
  ];

  tabs.forEach(tab => {
    document.getElementById(tab.id).addEventListener("click", () => {
      // Toggle active class on tabs
      tabs.forEach(t => document.getElementById(t.id).classList.remove("active"));
      document.getElementById(tab.id).classList.add("active");
      
      selectedType = tab.value;
      renderAll();
    });
  });

  // Clear filters button
  btnClearFilters.addEventListener("click", () => {
    selectedRegion = "";
    selectedType = "All";
    selectedStatus = "";
    selectedPriority = "";
    searchQuery = "";
    
    // Reset DOM elements
    filterRegion.value = "";
    filterStatus.value = "";
    filterPriority.value = "";
    globalSearchInput.value = "";
    
    // Reset tabs
    tabs.forEach(t => document.getElementById(t.id).classList.remove("active"));
    document.getElementById("tab-all").classList.add("active");

    // Reset map
    const paths = document.querySelectorAll("svg#france-map path");
    paths.forEach(p => p.classList.remove("selected"));
    document.getElementById("map-filter-indicator").style.display = "none";

    renderAll();
    showToast("Tous les filtres ont été réinitialisés", "info");
  });
}

// Top Header Actions (Import, Export, Open form modal)
function setupActionButtons() {
  const btnAddLead = document.getElementById("btn-add-lead");
  const btnExport = document.getElementById("btn-export-data");
  const btnImport = document.getElementById("btn-import-data");
  const fileInput = document.getElementById("import-file-input");

  btnAddLead.addEventListener("click", () => {
    openLeadModal();
  });

  // Export listings to JSON file download
  btnExport.addEventListener("click", () => {
    const dataStr = JSON.stringify(postings, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `agis_fomasfam_database_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast("Base de données exportée avec succès", "success");
  });

  // Trigger file upload dialog for import
  btnImport.addEventListener("click", () => {
    fileInput.click();
  });

  // File import parse & validate
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        
        // Simple structure validation
        if (Array.isArray(importedData) && importedData.every(item => item.id && item.type && item.title)) {
          postings = importedData;
          localStorage.setItem("agis_fomasfam_postings", JSON.stringify(postings));
          renderAll();
          showToast(`${postings.length} fiches importées avec succès !`, "success");
        } else {
          showToast("Format JSON invalide. Il doit s'agir d'un tableau d'éléments valides.", "error");
        }
      } catch (err) {
        showToast("Impossible de lire le fichier JSON.", "error");
      }
    };
    reader.readAsText(file);
    fileInput.value = ""; // clear input
  });
}

// Slide-out Drawer logic (Details, notes, status, template messaging)
function setupDrawerListeners() {
  const btnCloseDrawer = document.getElementById("btn-close-drawer");
  const drawerOverlay = document.getElementById("drawer-overlay");
  
  const statusSelect = document.getElementById("drawer-status-select");
  const prioritySelect = document.getElementById("drawer-priority-select");
  const btnSaveNotes = document.getElementById("btn-save-notes");
  const notesInput = document.getElementById("drawer-notes-input");
  
  const templateSelect = document.getElementById("activation-template-select");
  const btnCopyTemplate = document.getElementById("btn-copy-template");
  const btnSendTemplate = document.getElementById("btn-send-template");
  
  const btnDelete = document.getElementById("btn-delete-lead");

  // Close actions
  btnCloseDrawer.addEventListener("click", closeDrawer);
  drawerOverlay.addEventListener("click", (e) => {
    if (e.target === drawerOverlay) closeDrawer();
  });

  // Inline status modification in drawer
  statusSelect.addEventListener("change", (e) => {
    const lead = postings.find(p => p.id === currentActiveLeadId);
    if (lead) {
      lead.status = e.target.value;
      savePostingsToStorage();
      renderAll();
      showToast(`Statut mis à jour : ${translateStatus(lead.status)}`, "success");
    }
  });

  // Inline priority modification in drawer
  prioritySelect.addEventListener("change", (e) => {
    const lead = postings.find(p => p.id === currentActiveLeadId);
    if (lead) {
      lead.priority = e.target.value;
      savePostingsToStorage();
      renderAll();
      showToast(`Urgence mise à jour : ${translatePriority(lead.priority)}`, "success");
    }
  });

  // Save notes
  btnSaveNotes.addEventListener("click", () => {
    const lead = postings.find(p => p.id === currentActiveLeadId);
    if (lead) {
      lead.notes = notesInput.value;
      savePostingsToStorage();
      showToast("Notes de suivi enregistrées !", "success");
    }
  });

  // Compile messaging templates when selecting models
  templateSelect.addEventListener("change", () => {
    updateTemplatePreview();
  });

  // Copy template text
  btnCopyTemplate.addEventListener("click", () => {
    const previewText = document.getElementById("activation-template-preview").innerText;
    navigator.clipboard.writeText(previewText)
      .then(() => showToast("Modèle copié dans le presse-papiers !", "success"))
      .catch(() => showToast("Erreur lors de la copie", "error"));
  });

  // Send mail action (mailto integration)
  btnSendTemplate.addEventListener("click", () => {
    const lead = postings.find(p => p.id === currentActiveLeadId);
    if (lead) {
      const selectTemplateFn = emailTemplates[templateSelect.value];
      const body = selectTemplateFn(lead);
      const subject = `Recherche de place en ${lead.type} - ${lead.familyMember}`;
      
      const mailtoLink = `mailto:${lead.contactEmail || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoLink;
    }
  });

  // Delete lead handler
  btnDelete.addEventListener("click", () => {
    const lead = postings.find(p => p.id === currentActiveLeadId);
    if (lead) {
      if (confirm(`Voulez-vous vraiment supprimer la fiche de ${lead.familyMember} ?`)) {
        postings = postings.filter(p => p.id !== currentActiveLeadId);
        savePostingsToStorage();
        closeDrawer();
        renderAll();
        showToast("La fiche a été supprimée.", "success");
      }
    }
  });
}

// Modal Form handling for manually adding leads
function setupModalFormListeners() {
  const modal = document.getElementById("add-lead-modal");
  const form = document.getElementById("lead-form");
  const btnCancel = document.getElementById("btn-cancel-modal");

  btnCancel.addEventListener("click", () => {
    modal.classList.remove("open");
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const leadId = document.getElementById("form-lead-id").value;
    const type = document.getElementById("form-type").value;
    const priority = document.getElementById("form-priority").value;
    const title = document.getElementById("form-title").value;
    const familyMember = document.getElementById("form-family-member").value;
    const age = parseInt(document.getElementById("form-age").value);
    const handicap = document.getElementById("form-handicap").value;
    const region = document.getElementById("form-region").value;
    const description = document.getElementById("form-description").value;
    const contactName = document.getElementById("form-contact-name").value;
    const contactPhone = document.getElementById("form-contact-phone").value;
    const contactEmail = document.getElementById("form-contact-email").value;
    const contactSocial = document.getElementById("form-contact-social").value;

    const newLead = {
      id: leadId || "post-" + Date.now(),
      type,
      status: "New",
      priority,
      date: new Date().toISOString().slice(0, 10),
      region,
      title,
      description,
      handicap,
      age,
      familyMember,
      contactName,
      contactPhone,
      contactEmail,
      contactSocial,
      notes: ""
    };

    if (leadId) {
      // Edit existing
      const index = postings.findIndex(p => p.id === leadId);
      if (index !== -1) {
        newLead.status = postings[index].status;
        newLead.notes = postings[index].notes;
        postings[index] = newLead;
        showToast("La fiche a été mise à jour.", "success");
      }
    } else {
      // Add new
      postings.unshift(newLead);
      showToast(`Fiche de ${familyMember} ajoutée avec succès !`, "success");
    }

    savePostingsToStorage();
    modal.classList.remove("open");
    renderAll();
  });
}

// Open Form modal
function openLeadModal(lead = null) {
  const modal = document.getElementById("add-lead-modal");
  const formTitle = document.getElementById("modal-form-title");
  
  // Clear previous values
  document.getElementById("lead-form").reset();
  document.getElementById("form-lead-id").value = "";

  if (lead) {
    formTitle.textContent = "Modifier la fiche de demande";
    document.getElementById("form-lead-id").value = lead.id;
    document.getElementById("form-type").value = lead.type;
    document.getElementById("form-priority").value = lead.priority;
    document.getElementById("form-title").value = lead.title;
    document.getElementById("form-family-member").value = lead.familyMember;
    document.getElementById("form-age").value = lead.age;
    document.getElementById("form-handicap").value = lead.handicap;
    document.getElementById("form-region").value = lead.region;
    document.getElementById("form-description").value = lead.description;
    document.getElementById("form-contact-name").value = lead.contactName;
    document.getElementById("form-contact-phone").value = lead.contactPhone;
    document.getElementById("form-contact-email").value = lead.contactEmail;
    document.getElementById("form-contact-social").value = lead.contactSocial;
  } else {
    formTitle.textContent = "Créer une fiche de demande";
  }

  modal.classList.add("open");
}

// Save postings state to localStorage
function savePostingsToStorage() {
  localStorage.setItem("agis_fomasfam_postings", JSON.stringify(postings));
}

// Side Drawer Open Controller
function openDrawer(leadId) {
  currentActiveLeadId = leadId;
  const lead = postings.find(p => p.id === leadId);
  if (!lead) return;

  // Set values
  document.getElementById("drawer-type-badge").textContent = lead.type;
  document.getElementById("drawer-type-badge").className = `badge badge-type ${lead.type}`;
  document.getElementById("drawer-title").textContent = lead.title;
  
  document.getElementById("drawer-status-select").value = lead.status;
  document.getElementById("drawer-priority-select").value = lead.priority;
  
  document.getElementById("drawer-family-member").textContent = lead.familyMember;
  document.getElementById("drawer-age").textContent = `${lead.age} ans`;
  document.getElementById("drawer-handicap").textContent = lead.handicap || "Non spécifié";
  document.getElementById("drawer-region").textContent = lead.region;
  
  document.getElementById("drawer-description").textContent = lead.description;
  document.getElementById("drawer-date").textContent = `Découvert le ${formatDateFrench(lead.date)}`;
  
  const socialLink = document.getElementById("drawer-social-link");
  if (lead.contactSocial) {
    socialLink.href = lead.contactSocial;
    socialLink.style.display = "inline-flex";
  } else {
    socialLink.style.display = "none";
  }

  document.getElementById("drawer-contact-name").textContent = lead.contactName;
  document.getElementById("drawer-contact-phone").textContent = lead.contactPhone || "Non renseigné";
  document.getElementById("drawer-contact-email").textContent = lead.contactEmail || "Non renseigné";

  // Dial / Mail action button attributes
  const callBtn = document.getElementById("drawer-call-btn");
  if (lead.contactPhone) {
    callBtn.href = `tel:${lead.contactPhone.replace(/\s+/g, '')}`;
    callBtn.style.display = "inline-flex";
  } else {
    callBtn.style.display = "none";
  }

  const mailBtn = document.getElementById("drawer-mail-btn");
  if (lead.contactEmail) {
    const defaultSubject = `Recherche de place en ${lead.type} - ${lead.familyMember}`;
    const defaultBody = emailTemplates["request-info"](lead);
    mailBtn.href = `mailto:${lead.contactEmail}?subject=${encodeURIComponent(defaultSubject)}&body=${encodeURIComponent(defaultBody)}`;
    mailBtn.style.display = "inline-flex";
  } else {
    mailBtn.style.display = "none";
  }

  // Set notes
  document.getElementById("drawer-notes-input").value = lead.notes || "";

  // Render messaging template preview
  updateTemplatePreview();

  // Show drawer UI
  document.getElementById("drawer-overlay").classList.add("open");
  document.getElementById("detail-drawer").classList.add("open");
}

function closeDrawer() {
  document.getElementById("drawer-overlay").classList.remove("open");
  document.getElementById("detail-drawer").classList.remove("open");
  currentActiveLeadId = null;
}

// Compile template inside preview box
function updateTemplatePreview() {
  const templateSelect = document.getElementById("activation-template-select");
  const previewDiv = document.getElementById("activation-template-preview");
  const lead = postings.find(p => p.id === currentActiveLeadId);
  
  if (lead) {
    const selectTemplateFn = emailTemplates[templateSelect.value];
    previewDiv.innerText = selectTemplateFn(lead);
  }
}

// Simulated Crawler Scan Trigger
function setupScanTrigger() {
  const btnScan = document.getElementById("btn-trigger-scan");
  const scanStatus = document.getElementById("scan-status-indicator");
  const consoleLogs = document.getElementById("console-logs");
  
  btnScan.addEventListener("click", () => {
    if (isScanning) {
      clearInterval(scanInterval);
      isScanning = false;
      btnScan.textContent = "Lancer le Scan";
      scanStatus.style.display = "none";
      writeLogLine("info", "Scan network search aborted by operator.");
      return;
    }

    isScanning = true;
    btnScan.textContent = "Arrêter le Scan";
    scanStatus.style.display = "flex";
    writeLogLine("info", "Starting new crawl search sequence...");
    
    let step = 0;
    
    // Simulate real logs appearing every few seconds
    scanInterval = setInterval(() => {
      if (step < crawlerLogTemplates.length) {
        const log = crawlerLogTemplates[step];
        writeLogLine(log.level, log.text);
        step++;
      } else {
        // Complete cycle: Add a random new post from our simulation pile
        // check if all simulation leads are already in
        const unusedLeads = simulatedNewLeads.filter(sim => !postings.some(p => p.title === sim.title));
        
        if (unusedLeads.length > 0) {
          const randomIndex = Math.floor(Math.random() * unusedLeads.length);
          const rawLead = unusedLeads[randomIndex];
          
          const newLead = {
            ...rawLead,
            id: "post-" + Date.now(),
            status: "New",
            date: new Date().toISOString().slice(0, 10),
            notes: ""
          };
          
          postings.unshift(newLead);
          savePostingsToStorage();
          renderAll();
          
          writeLogLine("success", `ALERT: New active request identified! Injected: ${newLead.familyMember} (${newLead.region})`);
          showToast(`Nouveau post détecté en région ${newLead.region} (${newLead.familyMember}) !`, "success");
        } else {
          writeLogLine("info", "Scan complete. No new postings found on current public feeds.");
        }
        
        clearInterval(scanInterval);
        isScanning = false;
        btnScan.textContent = "Lancer le Scan";
        scanStatus.style.display = "none";
      }
    }, 2000);
  });
}

function writeLogLine(level, text) {
  const consoleLogs = document.getElementById("console-logs");
  const dateStr = new Date().toLocaleTimeString("fr-FR");
  const logLine = document.createElement("div");
  logLine.className = `console-line ${level}`;
  logLine.textContent = `[${dateStr}] [${level.toUpperCase()}] ${text}`;
  consoleLogs.appendChild(logLine);
  
  // auto scroll to bottom
  consoleLogs.scrollTop = consoleLogs.scrollHeight;
}

// Master Render functions
function renderAll() {
  // Update Statistics
  renderDashboardCounts();
  
  // Render Lead cards feed
  renderLeadsFeed();
  
  // Update map visual flags (has active requests)
  updateMapHighlighting();

  // Toggle reset filter button visibility
  const btnClearFilters = document.getElementById("btn-clear-filters");
  if (selectedRegion || selectedType !== "All" || selectedStatus || selectedPriority || searchQuery) {
    btnClearFilters.style.display = "inline-flex";
  } else {
    btnClearFilters.style.display = "none";
  }

  // Re-init lucide icons on rendered items
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function renderDashboardCounts() {
  const countFo = postings.filter(p => p.type === "FO" && p.status !== "Closed").length;
  const countMas = postings.filter(p => p.type === "MAS" && p.status !== "Closed").length;
  const countFam = postings.filter(p => p.type === "FAM" && p.status !== "Closed").length;
  const countSecured = postings.filter(p => p.status === "Spot Secured").length;
  
  const totalActives = postings.filter(p => p.status !== "Closed").length;
  const percent = totalActives > 0 ? Math.round((countSecured / postings.length) * 100) : 0;

  document.getElementById("count-fo").textContent = countFo;
  document.getElementById("count-mas").textContent = countMas;
  document.getElementById("count-fam").textContent = countFam;
  document.getElementById("count-secured").textContent = countSecured;
  document.getElementById("percent-secured").textContent = `${percent}% résolus`;
}

function renderLeadsFeed() {
  const container = document.getElementById("leads-cards-container");
  container.innerHTML = "";

  // Filter listings
  const filtered = getFilteredPostings();

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <i data-lucide="folder-search"></i>
        <span class="empty-state-title">Aucune fiche ne correspond à vos filtres</span>
        <p style="font-size:0.8rem; color:var(--text-muted);">Essayez de réinitialiser vos critères de recherche.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  // Build card elements
  filtered.forEach(lead => {
    const card = document.createElement("div");
    card.className = `lead-card type-${lead.type}`;
    
    // Status badge style mapping
    let priorityClass = lead.priority; // High, Medium, Low
    
    card.innerHTML = `
      <div class="card-header-line">
        <div class="badge-row">
          <span class="badge badge-type ${lead.type}">${lead.type}</span>
          <span class="badge badge-priority ${priorityClass}">${translatePriority(lead.priority)}</span>
        </div>
        <span class="post-date">${formatDateFrench(lead.date)}</span>
      </div>
      
      <h3 class="card-title">${lead.title}</h3>
      <p class="card-snippet">${lead.description}</p>
      
      <div class="card-footer-info">
        <span class="info-item region">
          <i data-lucide="map-pin"></i>
          ${lead.region}
        </span>
        <span class="badge badge-status" style="border-left: 3px solid var(--status-${lead.status.replace(/\s+/g, '-').toLowerCase()}); padding-left: 6px;">
          ${translateStatus(lead.status)}
        </span>
      </div>
    `;

    // Click handler to open detailed drawer
    card.addEventListener("click", () => {
      openDrawer(lead.id);
    });

    container.appendChild(card);
  });
}

function updateMapHighlighting() {
  const paths = document.querySelectorAll("svg#france-map path");
  
  paths.forEach(path => {
    const region = path.getAttribute("data-region");
    // count active postings in region
    const activeRegionCount = postings.filter(p => p.region === region && p.status !== "Closed" && p.status !== "Spot Secured").length;
    
    if (activeRegionCount > 0) {
      path.classList.add("has-listings");
    } else {
      path.classList.remove("has-listings");
    }

    // sync selected
    if (selectedRegion === region) {
      path.classList.add("selected");
    } else {
      path.classList.remove("selected");
    }
  });
}

// Returns the subset of postings matching active filter states
function getFilteredPostings() {
  return postings.filter(p => {
    // Type Filter
    if (selectedType !== "All" && p.type !== selectedType) return false;
    
    // Region Filter
    if (selectedRegion && p.region !== selectedRegion) return false;
    
    // Status Filter
    if (selectedStatus && p.status !== selectedStatus) return false;
    
    // Priority Filter
    if (selectedPriority && p.priority !== selectedPriority) return false;
    
    // Search Query
    if (searchQuery) {
      const matchTitle = p.title.toLowerCase().includes(searchQuery);
      const matchDesc = p.description.toLowerCase().includes(searchQuery);
      const matchMember = p.familyMember.toLowerCase().includes(searchQuery);
      const matchHandicap = p.handicap && p.handicap.toLowerCase().includes(searchQuery);
      const matchRegion = p.region.toLowerCase().includes(searchQuery);
      
      if (!matchTitle && !matchDesc && !matchMember && !matchHandicap && !matchRegion) {
        return false;
      }
    }
    
    return true;
  });
}

// Renders full database manager table in secondary view
function renderFullTable() {
  const container = document.getElementById("all-leads-table-container");
  container.innerHTML = "";

  const filtered = getFilteredPostings();

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="database-backup"></i>
        <span class="empty-state-title">Base de données vide</span>
        <p style="font-size: 0.8rem;">Aucune entrée ne correspond aux filtres courants.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  // Create responsive table layout
  const tableWrap = document.createElement("div");
  tableWrap.style.overflowX = "auto";
  
  let rowsHtml = filtered.map(lead => `
    <tr style="border-bottom: 1px solid var(--border-color); cursor: pointer;" onclick="openDrawer('${lead.id}')">
      <td style="padding: 1rem 0.5rem;"><span class="badge badge-type ${lead.type}">${lead.type}</span></td>
      <td style="padding: 1rem 0.5rem; font-weight:600; color:white;">${lead.familyMember}</td>
      <td style="padding: 1rem 0.5rem;">${lead.age} ans</td>
      <td style="padding: 1rem 0.5rem; color:var(--accent-purple); font-weight:500;">${lead.region}</td>
      <td style="padding: 1rem 0.5rem;">${lead.handicap || "Non spécifié"}</td>
      <td style="padding: 1rem 0.5rem;">
        <span class="badge badge-priority ${lead.priority}">${translatePriority(lead.priority)}</span>
      </td>
      <td style="padding: 1rem 0.5rem;">
        <span class="badge badge-status" style="border-left:3px solid var(--status-${lead.status.replace(/\s+/g, '-').toLowerCase()}); padding-left: 6px;">
          ${translateStatus(lead.status)}
        </span>
      </td>
      <td style="padding: 1rem 0.5rem; text-align:right;">
        <button class="btn btn-secondary" style="padding: 0.3rem 0.6rem; font-size:0.75rem;" onclick="event.stopPropagation(); openLeadModalById('${lead.id}')">
          <i data-lucide="edit-3" style="width:12px; height:12px;"></i>
        </button>
      </td>
    </tr>
  `).join("");

  tableWrap.innerHTML = `
    <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.85rem;">
      <thead>
        <tr style="border-bottom: 2px solid var(--border-color); color:var(--text-secondary); font-weight:600;">
          <th style="padding: 0.75rem 0.5rem;">Type</th>
          <th style="padding: 0.75rem 0.5rem;">Prénom</th>
          <th style="padding: 0.75rem 0.5rem;">Âge</th>
          <th style="padding: 0.75rem 0.5rem;">Région</th>
          <th style="padding: 0.75rem 0.5rem;">Handicap</th>
          <th style="padding: 0.75rem 0.5rem;">Urgence</th>
          <th style="padding: 0.75rem 0.5rem;">Statut</th>
          <th style="padding: 0.75rem 0.5rem; text-align:right;">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;

  container.appendChild(tableWrap);
  if (window.lucide) window.lucide.createIcons();
}

// Global scope bindings for inline onclick attributes in rendered HTML
window.openDrawer = (id) => openDrawer(id);
window.openLeadModalById = (id) => {
  const lead = postings.find(p => p.id === id);
  if (lead) openLeadModal(lead);
};

// Toast Notifications helper
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  let icon = "info";
  if (type === "success") icon = "check-circle";
  if (type === "error") icon = "alert-triangle";

  toast.innerHTML = `
    <i data-lucide="${icon}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();

  // Auto remove toast after 3 seconds
  setTimeout(() => {
    toast.style.animation = "toast-in 0.3s reverse forwards";
    setTimeout(() => {
      container.removeChild(toast);
    }, 300);
  }, 3000);
}

// Translation helpers
function translatePriority(p) {
  switch(p) {
    case "High": return "Urgent";
    case "Medium": return "Moyen";
    case "Low": return "Normal";
    default: return p;
  }
}

function translateStatus(s) {
  switch(s) {
    case "New": return "Nouveau";
    case "Contacted": return "Contacté";
    case "Waiting List": return "Liste d'attente";
    case "Interview Scheduled": return "Entretien fixé";
    case "Spot Secured": return "Place obtenue";
    case "Closed": return "Clôturé";
    default: return s;
  }
}

function formatDateFrench(dateString) {
  if (!dateString) return "";
  const parts = dateString.split("-");
  if (parts.length !== 3) return dateString;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
