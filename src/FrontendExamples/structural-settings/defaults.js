export const STORAGE_KEY = "frontend-example-structural-settings";

export function createDefaultGlobalConfig() {
  return {
    reservoir_water_level: 45,
    dam_top_elevation: 50,
    dam_bottom_elevation: 10,
    dam_top_width: 8,
    upstream_slope: 2.5,
    downstream_slope: 2.2,
    core_top_elevation: 48,
    core_top_width: 4,
    core_bottom_width: 12,
    core_permeability_coefficient: 1.0e-5,
    material_type: "earth",
    permeability_coefficient: 1.0e-7,
    prism_top_elevation: 18,
    prism_top_width: 4,
    prism_slope: 1.5,
    step_height: 8,
    step_width: 2,
    coreWallEnabled: true,
    drainElev: 18,
    prism_inner_slope: 0.6
  };
}

export function createDefaultSections() {
  return [
    {
      id: 1,
      name: "断面 01",
      localLevel: null,
      sensors: [
        { id: "P1", x: 10, bottom: 12, water: 43.5 },
        { id: "P2", x: 20, bottom: 20, water: 39.5 },
        { id: "P3", x: 40, bottom: 18, water: 22.1 },
        { id: "P4", x: 50, bottom: 11, water: 16.5 }
      ]
    }
  ];
}

export function cloneDefaults(value) {
  return JSON.parse(JSON.stringify(value));
}
