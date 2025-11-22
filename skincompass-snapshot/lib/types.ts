export type WearEN =
  | "Factory New"
  | "Minimal Wear"
  | "Field-Tested"
  | "Well-Worn"
  | "Battle-Scarred";

export type Weapon = string;

export type Skin = {
  id: string;
  weapon: Weapon;
  name: string;
  stattrak?: boolean;
  souvenir?: boolean;
  // Optional: falls ein Skin abweichende Wear-Stufen hat
  wears?: WearEN[];
};