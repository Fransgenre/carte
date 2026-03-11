# Changelog

Tous les changements notables apportés à ce projet seront documentés ici.

Le format est basé sur [Tenez un Changelog](https://keepachangelog.com/fr/1.1.0/),
et ce projet utilise le [Versionnage Sémantique](https://semver.org/spec/v2.0.0.html).

## [Prochaine version]

## [1.4.0] - 11/03/2026

### Ajouté

- L'identifiant de l'entité est desormais affiché sur sa fiche dans le backend, avec un bouton pour le copier facilement ([#57](https://github.com/Fransgenre/carte/pull/57))
- L'UUID d'un jeton d'accès à la carte peut desormais être généré automatiquement à l'aide d'un bouton à côté de son champ de saisie. ([#59](https://github.com/Fransgenre/carte/pull/59))
- Le journal des changements fait sa première apparition ! ([#98](https://github.com/Fransgenre/carte/pull/98))
- Ajout d’un bouton pour aller à l’entité rattachée à un commentaire. ([#72](https://github.com/Fransgenre/carte/pull/72))
- Boutons pour déplier ou replier tous les évènements. ([#73](https://github.com/Fransgenre/carte/pull/73))

### Modifié

- Passage de Nuxt v3 à Nuxt v4 et mise à jour des dépendances ([#51](https://github.com/Fransgenre/carte/pull/51))
- Libellé et coordonnées de l'adresse personnalisables lors de l'ajout d'entité ([#83](https://github.com/Fransgenre/carte/pull/83))
- Zoom dynamique selon la zone géographique retournée lors de la recherche de lieu ([#99](https://github.com/Fransgenre/carte/pull/99))
- Renomme "France métropolitaine" en "France hexagonale" lors de la recherche de lieu et d'adresse ([#100](https://github.com/Fransgenre/carte/pull/100))

### Corrigé

- Apporte des corrections mineures à l'interface d'admin, notamment, corrige des redirections erronées ([#85](https://github.com/Fransgenre/carte/pull/85), [#86](https://github.com/Fransgenre/carte/pull/86) et [#87](https://github.com/Fransgenre/carte/pull/87))
- Affiche les retours à la ligne dans les champs multi-ligne ([#91](https://github.com/Fransgenre/carte/pull/91))
- Résolution de l'impossibilité de creer un commentaire depuis la liste des commentaires en attente ([#56](https://github.com/Fransgenre/carte/pull/56))
- Le changement des filtres des entités dans le backend fait désormais revenir l'affichage en page 1 ([#78](https://github.com/Fransgenre/carte/pull/78))
- Résolution du problème d'accessibilité empêchant d'ajouter une entité au clavier ([#65](https://github.com/Fransgenre/carte/pull/65))
- Correction de l'erreur dans les listes d'entités en admin si une entité parente n'a pas d'adresse ([#67](https://github.com/Fransgenre/carte/pull/67))
- Correction d'un bug permettant la soumission d'entités ou de commentaires avec un champ `data` nul ([#80](https://github.com/Fransgenre/carte/pull/80))
- Recentre la carte de saisie d'adresse lors de recherches successives ([#82](https://github.com/Fransgenre/carte/pull/82))
- Dépliage et repliage un par un des évènements. ([#73](https://github.com/Fransgenre/carte/pull/73))

### Interne

- CI : Validation des types TypeScript ([#84](https://github.com/Fransgenre/carte/pull/84))
- Nix n’est plus utilisé pour construire l’image, et est optionnel pour développer. ([#52](https://github.com/Fransgenre/carte/pull/52))
