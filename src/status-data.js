(function () {
  "use strict";

  const phases = {
    preparation: {
      label: "Preparation and formal check",
      estimate: "1 to 3 months",
      minDays: 30,
      maxDays: 90,
    },
    instruction: {
      label: "Prefecture instruction",
      estimate: "6 to 12 months",
      minDays: 180,
      maxDays: 365,
    },
    entretien: {
      label: "Completeness, checks, interview",
      estimate: "1 to 4 months",
      minDays: 30,
      maxDays: 120,
    },
    decision_pref: {
      label: "Prefecture decision",
      estimate: "2 to 6 months",
      minDays: 60,
      maxDays: 180,
    },
    sdanf: {
      label: "SDANF / SCEC control",
      estimate: "6 to 18 months",
      minDays: 180,
      maxDays: 540,
    },
    decret: {
      label: "Decree preparation",
      estimate: "1 to 3 months",
      minDays: 30,
      maxDays: 90,
    },
    journal: {
      label: "Journal Officiel publication",
      estimate: "days to a few weeks",
      minDays: 3,
      maxDays: 30,
    },
    final_positive: {
      label: "Naturalized / final positive step",
      estimate: "complete",
      minDays: 0,
      maxDays: 0,
    },
    negative: {
      label: "Negative decision, appeal, or closure",
      estimate: "variable",
      minDays: 0,
      maxDays: 120,
    },
  };

  const statusOrder = [
    "DRAFT",
    "DOSSIER_DEPOSE",
    "VERIFICATION_FORMELLE_A_TRAITER",
    "VERIFICATION_FORMELLE_EN_COURS",
    "VERIFICATION_FORMELLE_MISE_EN_DEMEURE",
    "INSTRUCTION_A_AFFECTER",
    "INSTRUCTION_RECEPISSE_COMPLETUDE_A_ENVOYER",
    "INSTRUCTION_RECEPISSE_COMPLETUDE_A_ENVOYER_RETOUR_COMPLEMENT_A_TRAITER",
    "INSTRUCTION_DATE_EA_A_FIXER",
    "EA_EN_ATTENTE_EA",
    "EA_DEMANDE_REPORT_EA",
    "EA_CREA_A_VALIDER",
    "PROP_DECISION_PREF_A_EFFECTUER",
    "PROP_DECISION_PREF_EN_ATTENTE_RETOUR_HIERARCHIQUE",
    "PROP_DECISION_PREF_PROP_A_EDITER",
    "PROP_DECISION_PREF_EN_ATTENTE_RETOUR_SIGNATAIRE",
    "CONTROLE_A_AFFECTER",
    "CONTROLE_A_EFFECTUER",
    "CONTROLE_EN_ATTENTE_PEC",
    "CONTROLE_PEC_A_FAIRE",
    "CONTROLE_TRANSMISE_POUR_DECRET",
    "CONTROLE_EN_ATTENTE_RETOUR_HIERARCHIQUE",
    "CONTROLE_DECISION_A_EDITER",
    "CONTROLE_EN_ATTENTE_SIGNATURE",
    "TRANSMIS_A_AC",
    "A_VERIFIER_AVANT_INSERTION_DECRET",
    "PRETE_POUR_INSERTION_DECRET",
    "DECRET_EN_PREPARATION",
    "DECRET_A_QUALIFIER",
    "DECRET_EN_VALIDATION",
    "INSEREE_DANS_DECRET",
    "DECRET_ENVOYE_PREFECTURE",
    "NOTIFICATION_ENVOYEE",
    "DECRET_NATURALISATION_PUBLIE",
    "DECRET_NATURALISATION_PUBLIE_JO",
    "DECRET_PUBLIE",
    "DEMANDE_TRAITEE",
  ];

  const negativeOrder = [
    "DECISION_NEGATIVE_EN_DELAIS_RECOURS",
    "DECISION_NOTIFIEE",
    "DEMANDE_EN_COURS_RAPO",
    "CONTROLE_DEMANDE_NOTIFIEE",
    "IRRECEVABILITE_MANIFESTE",
    "IRRECEVABILITE_MANIFESTE_EN_DELAIS_RECOURS",
    "CSS_MISE_EN_DEMEURE_A_AFFECTER",
    "CSS_MISE_EN_DEMEURE_A_REDIGER",
    "CSS_MANUELS_A_AFFECTER",
    "CSS_MANUELS_A_REDIGER",
    "CSS_AUTOMATIQUES_A_AFFECTER",
    "CSS_AUTOMATIQUES_A_REDIGER",
    "CSS_EN_DELAIS_RECOURS",
    "CSS_NOTIFIE",
  ];

  const statuses = {
    DRAFT: {
      phase: "preparation",
      label: "Draft dossier",
      detail: "The naturalization request is still being prepared and has not been submitted.",
      next: ["DOSSIER_DEPOSE"],
    },
    DOSSIER_DEPOSE: {
      phase: "preparation",
      label: "Dossier submitted",
      detail: "The dossier is registered and waiting for its first formal review.",
      next: ["VERIFICATION_FORMELLE_A_TRAITER"],
    },
    VERIFICATION_FORMELLE_A_TRAITER: {
      phase: "preparation",
      label: "Formal review queue",
      detail: "The prefecture has received the dossier and will check the mandatory documents and basic eligibility.",
      frequency: "6.2%",
      next: ["VERIFICATION_FORMELLE_EN_COURS", "INSTRUCTION_A_AFFECTER"],
    },
    VERIFICATION_FORMELLE_EN_COURS: {
      phase: "preparation",
      label: "Formal review in progress",
      detail: "An agent is checking the completeness and admissibility of the file.",
      next: ["INSTRUCTION_A_AFFECTER", "VERIFICATION_FORMELLE_MISE_EN_DEMEURE"],
    },
    VERIFICATION_FORMELLE_MISE_EN_DEMEURE: {
      phase: "preparation",
      label: "Formal notice: missing documents",
      detail: "The administration is asking for missing or non-compliant documents. Check ANEF messages and letters.",
      next: ["INSTRUCTION_A_AFFECTER", "CSS_MISE_EN_DEMEURE_A_AFFECTER"],
    },
    INSTRUCTION_A_AFFECTER: {
      phase: "instruction",
      label: "Receivable, waiting for an instructor",
      detail: "The file passed formal review and is waiting to be assigned to a prefecture instructor.",
      frequency: "16.6%",
      expectedOverride: "3 to 9 months is commonly observed for this queue; the broader prefecture phase is 6 to 12 months.",
      next: ["INSTRUCTION_RECEPISSE_COMPLETUDE_A_ENVOYER"],
    },
    INSTRUCTION_RECEPISSE_COMPLETUDE_A_ENVOYER: {
      phase: "instruction",
      label: "Complete dossier, receipt to send",
      detail: "A prefecture instructor is reviewing the file and the completeness receipt should be sent.",
      frequency: "6.6%",
      next: ["INSTRUCTION_DATE_EA_A_FIXER", "INSTRUCTION_RECEPISSE_COMPLETUDE_A_ENVOYER_RETOUR_COMPLEMENT_A_TRAITER"],
    },
    INSTRUCTION_RECEPISSE_COMPLETUDE_A_ENVOYER_RETOUR_COMPLEMENT_A_TRAITER: {
      phase: "instruction",
      label: "Additional documents under review",
      detail: "Documents sent after a request for complements are being checked.",
      next: ["INSTRUCTION_DATE_EA_A_FIXER"],
    },
    INSTRUCTION_DATE_EA_A_FIXER: {
      phase: "entretien",
      label: "Interview date to be set",
      detail: "Administrative checks have started and the assimilation interview date is to be scheduled.",
      frequency: "3.7%",
      next: ["EA_EN_ATTENTE_EA"],
    },
    EA_EN_ATTENTE_EA: {
      phase: "entretien",
      label: "Assimilation interview pending",
      detail: "The interview convocation has been sent or is expected. Prepare the assimilation interview.",
      frequency: "2.5%",
      next: ["EA_CREA_A_VALIDER", "EA_DEMANDE_REPORT_EA"],
    },
    EA_DEMANDE_REPORT_EA: {
      phase: "entretien",
      label: "Interview postponement requested",
      detail: "A postponement request has been registered and a new date should be proposed.",
      next: ["EA_EN_ATTENTE_EA"],
    },
    EA_CREA_A_VALIDER: {
      phase: "entretien",
      label: "Interview report to validate",
      detail: "The interview is done and the report is being prepared or validated.",
      frequency: "0.8%",
      next: ["PROP_DECISION_PREF_A_EFFECTUER"],
    },
    PROP_DECISION_PREF_A_EFFECTUER: {
      phase: "decision_pref",
      label: "Prefecture opinion in progress",
      detail: "The instructor is preparing the prefecture opinion before transmission or decision.",
      frequency: "3.2%",
      next: ["PROP_DECISION_PREF_EN_ATTENTE_RETOUR_HIERARCHIQUE"],
    },
    PROP_DECISION_PREF_EN_ATTENTE_RETOUR_HIERARCHIQUE: {
      phase: "decision_pref",
      label: "Opinion awaiting hierarchy validation",
      detail: "The instructor's proposal is waiting for internal validation.",
      frequency: "6.0%",
      next: ["PROP_DECISION_PREF_PROP_A_EDITER"],
    },
    PROP_DECISION_PREF_PROP_A_EDITER: {
      phase: "decision_pref",
      label: "Official opinion being drafted",
      detail: "The validated prefecture proposal is being edited.",
      next: ["PROP_DECISION_PREF_EN_ATTENTE_RETOUR_SIGNATAIRE"],
    },
    PROP_DECISION_PREF_EN_ATTENTE_RETOUR_SIGNATAIRE: {
      phase: "decision_pref",
      label: "Waiting for prefecture signature",
      detail: "The proposal is awaiting signature before moving to the ministry.",
      next: ["CONTROLE_A_AFFECTER"],
    },
    CONTROLE_A_AFFECTER: {
      phase: "sdanf",
      label: "SDANF queue",
      detail: "The file has arrived at SDANF in Reze and is waiting to be assigned to a ministry agent.",
      frequency: "19.6%",
      expectedOverride: "Often 6 to 18 months. This is the longest passive queue in the public 2026 observations.",
      next: ["CONTROLE_A_EFFECTUER"],
    },
    CONTROLE_A_EFFECTUER: {
      phase: "sdanf",
      label: "SDANF control in progress",
      detail: "A ministry agent is checking civil-status documents, consistency, morality, tax, residence, and professional stability.",
      frequency: "7.3%",
      expectedOverride: "Commonly several weeks to 4 months, but highly variable.",
      next: ["CONTROLE_EN_ATTENTE_PEC", "CONTROLE_TRANSMISE_POUR_DECRET", "CONTROLE_EN_ATTENTE_RETOUR_HIERARCHIQUE"],
    },
    CONTROLE_EN_ATTENTE_PEC: {
      phase: "sdanf",
      label: "SCEC civil-status check waiting",
      detail: "The file was transmitted to SCEC in Nantes for civil-status verification and is waiting to be taken in charge.",
      frequency: "7.4%",
      expectedOverride: "Low confidence: public reports in May 2026 mention many files blocked here since March 2026.",
      next: ["CONTROLE_PEC_A_FAIRE", "CONTROLE_A_EFFECTUER", "CONTROLE_TRANSMISE_POUR_DECRET"],
    },
    CONTROLE_PEC_A_FAIRE: {
      phase: "sdanf",
      label: "SCEC civil-status verification",
      detail: "SCEC is checking the foreign civil-status records.",
      expectedOverride: "Part of the SDANF/SCEC phase, observed broadly at 6 to 18 months depending on profile.",
      next: ["CONTROLE_A_EFFECTUER", "CONTROLE_TRANSMISE_POUR_DECRET"],
    },
    CONTROLE_TRANSMISE_POUR_DECRET: {
      phase: "decret",
      label: "Favorable, transmitted for decree",
      detail: "The file appears favorable and is transmitted for insertion into a naturalization decree.",
      next: ["CONTROLE_EN_ATTENTE_RETOUR_HIERARCHIQUE", "TRANSMIS_A_AC", "PRETE_POUR_INSERTION_DECRET"],
    },
    CONTROLE_EN_ATTENTE_RETOUR_HIERARCHIQUE: {
      phase: "decret",
      label: "Ministry hierarchy validation",
      detail: "A favorable decision or decree preparation item is awaiting hierarchy validation.",
      next: ["CONTROLE_DECISION_A_EDITER"],
    },
    CONTROLE_DECISION_A_EDITER: {
      phase: "decret",
      label: "Decision editing",
      detail: "The favorable decision document is being edited.",
      next: ["CONTROLE_EN_ATTENTE_SIGNATURE"],
    },
    CONTROLE_EN_ATTENTE_SIGNATURE: {
      phase: "decret",
      label: "Waiting for ministry signature",
      detail: "The decree or favorable decision is awaiting signature.",
      next: ["TRANSMIS_A_AC", "PRETE_POUR_INSERTION_DECRET"],
    },
    TRANSMIS_A_AC: {
      phase: "decret",
      label: "Transmitted to central administration",
      detail: "The favorable file is with the decree service.",
      next: ["A_VERIFIER_AVANT_INSERTION_DECRET", "PRETE_POUR_INSERTION_DECRET"],
    },
    A_VERIFIER_AVANT_INSERTION_DECRET: {
      phase: "decret",
      label: "Final check before decree insertion",
      detail: "Final administrative checks are being run before insertion into a decree.",
      next: ["PRETE_POUR_INSERTION_DECRET"],
    },
    PRETE_POUR_INSERTION_DECRET: {
      phase: "decret",
      label: "Ready for decree insertion",
      detail: "The file is validated and ready to be inserted into a decree.",
      frequency: "3.1%",
      expectedOverride: "Usually days to a few weeks. Public observations report automatic movement on Monday morning.",
      next: ["INSEREE_DANS_DECRET"],
    },
    DECRET_EN_PREPARATION: {
      phase: "decret",
      label: "Decree in preparation",
      detail: "A decree including the application is being prepared.",
      next: ["DECRET_A_QUALIFIER", "DECRET_EN_VALIDATION"],
    },
    DECRET_A_QUALIFIER: {
      phase: "decret",
      label: "Decree qualification",
      detail: "The decree is being categorized and checked before final validation.",
      next: ["DECRET_EN_VALIDATION"],
    },
    DECRET_EN_VALIDATION: {
      phase: "decret",
      label: "Decree final validation",
      detail: "The decree is in final validation before signature and publication.",
      next: ["INSEREE_DANS_DECRET"],
    },
    INSEREE_DANS_DECRET: {
      phase: "journal",
      label: "Inserted into a signed decree",
      detail: "The name is inserted into a naturalization decree. Publication in the Journal Officiel is near.",
      frequency: "5.7%",
      expectedOverride: "Usually a few days to a few weeks before Journal Officiel publication.",
      next: ["DECRET_NATURALISATION_PUBLIE", "DECRET_ENVOYE_PREFECTURE"],
    },
    DECRET_ENVOYE_PREFECTURE: {
      phase: "journal",
      label: "Decree sent to prefecture",
      detail: "The signed decree was transmitted to the prefecture for notification or ceremony steps.",
      next: ["NOTIFICATION_ENVOYEE", "DECRET_NATURALISATION_PUBLIE"],
    },
    NOTIFICATION_ENVOYEE: {
      phase: "journal",
      label: "Official notification sent",
      detail: "The official naturalization notification has been sent.",
      next: ["DECRET_NATURALISATION_PUBLIE"],
    },
    DECRET_NATURALISATION_PUBLIE: {
      phase: "final_positive",
      label: "Decree published in the Journal Officiel",
      detail: "The naturalization decree is published. You are officially French.",
      frequency: "3.2%",
      next: [],
    },
    DECRET_NATURALISATION_PUBLIE_JO: {
      phase: "final_positive",
      label: "Decree published in the Journal Officiel",
      detail: "The naturalization decree is published. You are officially French.",
      next: [],
    },
    DECRET_PUBLIE: {
      phase: "final_positive",
      label: "Decree published",
      detail: "The decree is published and the naturalization process is effectively complete.",
      next: [],
    },
    DEMANDE_TRAITEE: {
      phase: "final_positive",
      label: "Request fully processed",
      detail: "The request is marked as processed. Check ANEF messages for the exact outcome.",
      next: [],
    },
    DECISION_NEGATIVE_EN_DELAIS_RECOURS: {
      phase: "negative",
      label: "Negative decision, appeal period open",
      detail: "A negative decision was issued. A RAPO or court appeal deadline may apply.",
      next: ["DEMANDE_EN_COURS_RAPO", "DECISION_NOTIFIEE"],
    },
    DECISION_NOTIFIEE: {
      phase: "negative",
      label: "Decision notified",
      detail: "The decision has been officially notified. Check ANEF letters and messages.",
      next: [],
    },
    DEMANDE_EN_COURS_RAPO: {
      phase: "negative",
      label: "RAPO appeal under review",
      detail: "An administrative appeal is being reviewed by the ministry.",
      expectedOverride: "Around 4 months is commonly cited for RAPO handling, but it varies.",
      next: ["DECISION_NOTIFIEE", "CONTROLE_DEMANDE_NOTIFIEE"],
    },
    CONTROLE_DEMANDE_NOTIFIEE: {
      phase: "negative",
      label: "Ministry control decision notified",
      detail: "The decision from ministry control has been notified.",
      next: [],
    },
    IRRECEVABILITE_MANIFESTE: {
      phase: "negative",
      label: "Manifestly inadmissible",
      detail: "The request does not meet legal admissibility conditions.",
      next: ["IRRECEVABILITE_MANIFESTE_EN_DELAIS_RECOURS"],
    },
    IRRECEVABILITE_MANIFESTE_EN_DELAIS_RECOURS: {
      phase: "negative",
      label: "Inadmissible, appeal period open",
      detail: "The inadmissibility decision can be challenged during the appeal period.",
      next: ["DEMANDE_EN_COURS_RAPO"],
    },
    CSS_MISE_EN_DEMEURE_A_AFFECTER: {
      phase: "negative",
      label: "Closure after formal notice: to assign",
      detail: "A closure process may have started after an unanswered formal notice.",
      next: ["CSS_MISE_EN_DEMEURE_A_REDIGER"],
    },
    CSS_MISE_EN_DEMEURE_A_REDIGER: {
      phase: "negative",
      label: "Closure after formal notice: drafting",
      detail: "A closure decision is being drafted after a formal notice.",
      next: ["CSS_EN_DELAIS_RECOURS", "CSS_NOTIFIE"],
    },
    CSS_MANUELS_A_AFFECTER: {
      phase: "negative",
      label: "Manual closure proposal: to assign",
      detail: "An agent has proposed closure without a final notification yet.",
      next: ["CSS_MANUELS_A_REDIGER"],
    },
    CSS_MANUELS_A_REDIGER: {
      phase: "negative",
      label: "Manual closure proposal: drafting",
      detail: "A manual closure decision is being drafted.",
      next: ["CSS_EN_DELAIS_RECOURS", "CSS_NOTIFIE"],
    },
    CSS_AUTOMATIQUES_A_AFFECTER: {
      phase: "negative",
      label: "Automatic closure: to assign",
      detail: "The system has triggered an automatic closure workflow.",
      next: ["CSS_AUTOMATIQUES_A_REDIGER"],
    },
    CSS_AUTOMATIQUES_A_REDIGER: {
      phase: "negative",
      label: "Automatic closure: drafting",
      detail: "An automatic closure decision is being drafted.",
      next: ["CSS_EN_DELAIS_RECOURS", "CSS_NOTIFIE"],
    },
    CSS_EN_DELAIS_RECOURS: {
      phase: "negative",
      label: "Closed without action, appeal period open",
      detail: "The file was closed without action and an appeal period may be open.",
      next: ["CSS_NOTIFIE", "DEMANDE_EN_COURS_RAPO"],
    },
    CSS_NOTIFIE: {
      phase: "negative",
      label: "Closure notified",
      detail: "The closure decision was notified. Read the reason before filing again or appealing.",
      next: [],
    },
  };

  const statusCopyFr = {
    DRAFT: {
      labelFr: "Brouillon",
      detailFr: "La demande de naturalisation est en cours de preparation et n'a pas encore ete deposee.",
    },
    DOSSIER_DEPOSE: {
      labelFr: "Dossier depose",
      detailFr: "Le dossier est enregistre et attend son premier controle formel.",
    },
    VERIFICATION_FORMELLE_A_TRAITER: {
      labelFr: "Controle formel en attente",
      detailFr: "La prefecture a recu le dossier et va verifier les pieces obligatoires et l'eligibilite de base.",
    },
    VERIFICATION_FORMELLE_EN_COURS: {
      labelFr: "Controle formel en cours",
      detailFr: "Un agent verifie la completude et la recevabilite du dossier.",
    },
    VERIFICATION_FORMELLE_MISE_EN_DEMEURE: {
      labelFr: "Mise en demeure : pieces manquantes",
      detailFr: "L'administration demande des pieces manquantes ou non conformes. Consultez les messages et courriers ANEF.",
    },
    INSTRUCTION_A_AFFECTER: {
      labelFr: "Recevable, en attente d'instructeur",
      detailFr: "Le dossier a passe le controle formel et attend d'etre affecte a un instructeur de prefecture.",
    },
    INSTRUCTION_RECEPISSE_COMPLETUDE_A_ENVOYER: {
      labelFr: "Dossier complet, recepisse a envoyer",
      detailFr: "Un instructeur de prefecture examine le dossier ; le recepisse de completude doit etre envoye.",
    },
    INSTRUCTION_RECEPISSE_COMPLETUDE_A_ENVOYER_RETOUR_COMPLEMENT_A_TRAITER: {
      labelFr: "Complements en cours d'examen",
      detailFr: "Les pieces envoyees apres une demande de complements sont en cours de verification.",
    },
    INSTRUCTION_DATE_EA_A_FIXER: {
      labelFr: "Date d'entretien a fixer",
      detailFr: "Les verifications administratives ont commence ; la date de l'entretien d'assimilation doit etre fixee.",
    },
    EA_EN_ATTENTE_EA: {
      labelFr: "Entretien d'assimilation en attente",
      detailFr: "La convocation a l'entretien a ete envoyee ou est attendue. Preparez l'entretien d'assimilation.",
    },
    EA_DEMANDE_REPORT_EA: {
      labelFr: "Report d'entretien demande",
      detailFr: "Une demande de report a ete enregistree ; une nouvelle date devrait etre proposee.",
    },
    EA_CREA_A_VALIDER: {
      labelFr: "Compte rendu d'entretien a valider",
      detailFr: "L'entretien est termine ; le compte rendu est en cours de redaction ou de validation.",
    },
    PROP_DECISION_PREF_A_EFFECTUER: {
      labelFr: "Proposition de la prefecture en cours",
      detailFr: "L'instructeur prepare l'avis de la prefecture avant transmission ou decision.",
    },
    PROP_DECISION_PREF_EN_ATTENTE_RETOUR_HIERARCHIQUE: {
      labelFr: "Avis en attente de validation hierarchique",
      detailFr: "La proposition de l'instructeur attend une validation interne.",
    },
    PROP_DECISION_PREF_PROP_A_EDITER: {
      labelFr: "Avis officiel en redaction",
      detailFr: "La proposition validee de la prefecture est en cours de redaction.",
    },
    PROP_DECISION_PREF_EN_ATTENTE_RETOUR_SIGNATAIRE: {
      labelFr: "En attente de signature prefectorale",
      detailFr: "La proposition attend la signature avant transmission au ministere.",
    },
    CONTROLE_A_AFFECTER: {
      labelFr: "File SDANF",
      detailFr: "Le dossier est arrive a la SDANF a Reze et attend d'etre affecte a un agent du ministere.",
    },
    CONTROLE_A_EFFECTUER: {
      labelFr: "Controle SDANF en cours",
      detailFr: "Un agent du ministere verifie l'etat civil, la coherence, la moralite, la fiscalite, la residence et la stabilite professionnelle.",
    },
    CONTROLE_EN_ATTENTE_PEC: {
      labelFr: "Controle SCEC en attente",
      detailFr: "Le dossier a ete transmis au SCEC a Nantes pour verification d'etat civil et attend d'etre pris en charge.",
    },
    CONTROLE_PEC_A_FAIRE: {
      labelFr: "Verification SCEC de l'etat civil",
      detailFr: "Le SCEC verifie les pieces d'etat civil etrangeres.",
    },
    CONTROLE_TRANSMISE_POUR_DECRET: {
      labelFr: "Favorable, transmis pour decret",
      detailFr: "Le dossier semble favorable et est transmis pour insertion dans un decret de naturalisation.",
    },
    CONTROLE_EN_ATTENTE_RETOUR_HIERARCHIQUE: {
      labelFr: "Validation hierarchique au ministere",
      detailFr: "Une decision favorable ou un element de preparation de decret attend une validation hierarchique.",
    },
    CONTROLE_DECISION_A_EDITER: {
      labelFr: "Decision en redaction",
      detailFr: "Le document de decision favorable est en cours de redaction.",
    },
    CONTROLE_EN_ATTENTE_SIGNATURE: {
      labelFr: "En attente de signature ministerielle",
      detailFr: "Le decret ou la decision favorable attend la signature.",
    },
    TRANSMIS_A_AC: {
      labelFr: "Transmis a l'administration centrale",
      detailFr: "Le dossier favorable est chez le service des decrets.",
    },
    A_VERIFIER_AVANT_INSERTION_DECRET: {
      labelFr: "Verification finale avant insertion au decret",
      detailFr: "Les dernieres verifications administratives sont en cours avant insertion dans un decret.",
    },
    PRETE_POUR_INSERTION_DECRET: {
      labelFr: "Pret pour insertion au decret",
      detailFr: "Le dossier est valide et pret a etre insere dans un decret.",
    },
    DECRET_EN_PREPARATION: {
      labelFr: "Decret en preparation",
      detailFr: "Un decret incluant la demande est en cours de preparation.",
    },
    DECRET_A_QUALIFIER: {
      labelFr: "Decret en qualification",
      detailFr: "Le decret est en cours de categorisation et de verification avant validation finale.",
    },
    DECRET_EN_VALIDATION: {
      labelFr: "Decret en validation finale",
      detailFr: "Le decret est en validation finale avant signature et publication.",
    },
    INSEREE_DANS_DECRET: {
      labelFr: "Inscrit dans un decret signe",
      detailFr: "Le nom est inscrit dans un decret de naturalisation. La publication au Journal officiel est proche.",
    },
    DECRET_ENVOYE_PREFECTURE: {
      labelFr: "Decret transmis a la prefecture",
      detailFr: "Le decret signe a ete transmis a la prefecture pour notification ou ceremonie.",
    },
    NOTIFICATION_ENVOYEE: {
      labelFr: "Notification officielle envoyee",
      detailFr: "La notification officielle de naturalisation a ete envoyee.",
    },
    DECRET_NATURALISATION_PUBLIE: {
      labelFr: "Decret publie au Journal officiel",
      detailFr: "Le decret de naturalisation est publie. Vous etes officiellement francais.",
    },
    DECRET_NATURALISATION_PUBLIE_JO: {
      labelFr: "Decret publie au Journal officiel",
      detailFr: "Le decret de naturalisation est publie. Vous etes officiellement francais.",
    },
    DECRET_PUBLIE: {
      labelFr: "Decret publie",
      detailFr: "Le decret est publie ; la procedure de naturalisation est effectivement terminee.",
    },
    DEMANDE_TRAITEE: {
      labelFr: "Demande entierement traitee",
      detailFr: "La demande est marquee comme traitee. Consultez les messages ANEF pour le resultat exact.",
    },
    DECISION_NEGATIVE_EN_DELAIS_RECOURS: {
      labelFr: "Decision negative, delai de recours ouvert",
      detailFr: "Une decision negative a ete prise. Un delai de RAPO ou de recours contentieux peut s'appliquer.",
    },
    DECISION_NOTIFIEE: {
      labelFr: "Decision notifiee",
      detailFr: "La decision a ete officiellement notifiee. Consultez les courriers et messages ANEF.",
    },
    DEMANDE_EN_COURS_RAPO: {
      labelFr: "Recours administratif (RAPO) en cours",
      detailFr: "Un recours administratif est en cours d'examen par le ministere.",
    },
    CONTROLE_DEMANDE_NOTIFIEE: {
      labelFr: "Decision du controle ministeriel notifiee",
      detailFr: "La decision issue du controle ministeriel a ete notifiee.",
    },
    IRRECEVABILITE_MANIFESTE: {
      labelFr: "Irrecevabilite manifeste",
      detailFr: "La demande ne remplit pas les conditions legales de recevabilite.",
    },
    IRRECEVABILITE_MANIFESTE_EN_DELAIS_RECOURS: {
      labelFr: "Irrecevable, delai de recours ouvert",
      detailFr: "La decision d'irrecevabilite peut etre contestee pendant le delai de recours.",
    },
    CSS_MISE_EN_DEMEURE_A_AFFECTER: {
      labelFr: "Cloture apres mise en demeure : a affecter",
      detailFr: "Une procedure de cloture a peut-etre commence apres une mise en demeure restee sans reponse.",
    },
    CSS_MISE_EN_DEMEURE_A_REDIGER: {
      labelFr: "Cloture apres mise en demeure : en redaction",
      detailFr: "Une decision de cloture est en cours de redaction apres une mise en demeure.",
    },
    CSS_MANUELS_A_AFFECTER: {
      labelFr: "Proposition de cloture manuelle : a affecter",
      detailFr: "Un agent a propose une cloture sans notification finale pour l'instant.",
    },
    CSS_MANUELS_A_REDIGER: {
      labelFr: "Proposition de cloture manuelle : en redaction",
      detailFr: "Une decision de cloture manuelle est en cours de redaction.",
    },
    CSS_AUTOMATIQUES_A_AFFECTER: {
      labelFr: "Cloture automatique : a affecter",
      detailFr: "Le systeme a declenche une procedure de cloture automatique.",
    },
    CSS_AUTOMATIQUES_A_REDIGER: {
      labelFr: "Cloture automatique : en redaction",
      detailFr: "Une decision de cloture automatique est en cours de redaction.",
    },
    CSS_EN_DELAIS_RECOURS: {
      labelFr: "Cloture sans suite, delai de recours ouvert",
      detailFr: "Le dossier a ete cloture sans suite ; un delai de recours peut etre ouvert.",
    },
    CSS_NOTIFIE: {
      labelFr: "Cloture notifiee",
      detailFr: "La decision de cloture a ete notifiee. Lisez le motif avant de redeposer ou de faire un recours.",
    },
  };

  for (const [code, copy] of Object.entries(statusCopyFr)) {
    if (statuses[code]) Object.assign(statuses[code], copy);
  }

  const sources = [
    {
      label: "ANEF public bundle",
      note: "Observed 2026-06-01: DOSSIER_STEPPER, CURRENT_STATES, FRISE_DEMANDE_NAT and current enum names.",
      url: "https://administration-etrangers-en-france.interieur.gouv.fr/particuliers/",
    },
    {
      label: "France Prefecture API guide",
      note: "Documents dossier_state, createdAt, updatedAt and practical API access.",
      url: "https://franceprefecture.fr/statut-api-anef-suivi-naturalisation-2025/",
    },
    {
      label: "Naturalisation Facile status data",
      note: "45 decoded ANEF API statuses, 7,825+ observed dossiers, April-May 2026.",
      url: "https://naturalisation-facile.fr/articles/statuts-anef-naturalisation-decodage-complet",
    },
    {
      label: "Services Publics+ experience",
      note: "May 2026 public reports of CONTROLE_EN_ATTENTE_PEC delays.",
      url: "https://www.plus.transformation.gouv.fr/experiences/7351575_naturalisation-par-decret-blocage-au-scec-statut-controle-en-attente-pec",
    },
  ];

  const endpoints = [
    "anf/dossier-stepper",
    "anf/usager/dossiers/frise-stepper",
    "anf/usager/current_states",
    "anf/usager/dossiers/statut",
    "anf/usager/decrets",
    "anf/usager/dmr/decrets",
    "anf/usager/rapo",
    "anf/usager/dossiers/historique",
  ];

  window.ANEF_TRACKER_DATA = {
    phases,
    statusOrder,
    negativeOrder,
    statuses,
    sources,
    endpoints,
  };
})();
