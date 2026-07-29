import { describe, it, expect } from "vitest";
import { parseFliInscriptionsCsv, mapFliInscriptionStatus } from "./fli-inscriptions-csv-import";

describe("parseFliInscriptionsCsv", () => {
  it("parses semicolon FLI inscription row", () => {
    const csv = `Modalité;Type;Effectif;Status;Entreprise;Nom et Prénom;Civilité;Rue ou localité;CP;Ville;Tél;Email;Langue;Formateur;Lieu du stage;Adresse du stage;Certification;j sem - date début;Date début;Date fin;Durée (en heures);Durée (en jours);Heures par jour;Coût pédagogique;Û; Mode de paiement acompte 1; Acompte;Date Acompte;Chèque;Date d'émission du chèque;Solde après acompte (txt); Solde après acompte;Rythme;Résultat test - entrée;Niveau entrée;Groupe;Horaires;Niv général en fin de stage;Niv spécifique;Date de la certification;Résultat Certif Barème Européen;Attentes;Observation;Horaires manuel;Support de cours;Code;Status final;Date début longue;Date fin longue;Tél Prof;e-mail Prof;QUALIOPI;École de SKI;Directeur de l'école de ski;N° de Portable du Directeur;Obervations sur la salle;Dates du logement;Adresse du logement;Observations sur le logement
Présentiel;Collectif;6 participants;Facturé;ESF Test;Jean Dupont;Monsieur;Rue 1;73000;Chambéry;06 00 00 00 00;jean.dupont@example.com;Anglais;Carole MOLLARD;Courchevel;Adresse stage;Linguaskill;lun;15/11/2021;19/11/2021;20;5;4;500;500 €;;;;;;;;;Faux débutant;Groupe 1;8h30;;;;;;;Code test;oui;;;;;ESF Courchevel;Directeur;0600000000;;;;`;

    const result = parseFliInscriptionsCsv(csv);
    expect(result.importableInscriptions).toBe(1);
    expect(result.uniqueMonitorContacts).toBe(1);
    expect(result.rows[0].email).toBe("jean.dupont@example.com");
    expect(result.rows[0].start_date).toBe("2021-11-15");
    expect(result.rows[0].status).toBe("facturee");
    expect(result.monitorContacts[0].email).toBe("jean.dupont@example.com");
  });

  it("maps cancelled status", () => {
    expect(mapFliInscriptionStatus("Annulé", "", null)).toBe("annulee");
  });
});
