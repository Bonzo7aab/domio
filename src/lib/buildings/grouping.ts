import type { Building } from '../../types/building';

function normalizePropertyPart(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Stable key for grouping buildings shown in job/tender property selects (by name only). */
export function getPropertyGroupKey(building: Pick<Building, 'name'>): string {
  return normalizePropertyPart(building.name);
}

export interface GroupedBuildingOption {
  key: string;
  name: string;
  street_address: string;
  city: string;
  /** Representative building id (newest record in the group). */
  primaryBuildingId: string;
  buildingIds: string[];
  count: number;
}

export function groupBuildingsForSelection(buildings: Building[]): GroupedBuildingOption[] {
  const groups = new Map<string, Building[]>();

  for (const building of buildings) {
    const key = getPropertyGroupKey(building);
    const existing = groups.get(key);
    if (existing) {
      existing.push(building);
    } else {
      groups.set(key, [building]);
    }
  }

  const options: GroupedBuildingOption[] = [];

  for (const [key, members] of groups) {
    const sorted = [...members].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    const primary = sorted[0];
    options.push({
      key,
      name: primary.name,
      street_address: primary.street_address,
      city: primary.city,
      primaryBuildingId: primary.id,
      buildingIds: sorted.map((b) => b.id),
      count: sorted.length,
    });
  }

  return options.sort((a, b) => a.name.localeCompare(b.name, 'pl'));
}

/** Maps any building id in a duplicate group to the primary id used in grouped selects. */
export function resolvePrimaryBuildingId(
  buildingId: string,
  buildings: Building[],
): string {
  if (!buildingId) return buildingId;
  const building = buildings.find((b) => b.id === buildingId);
  if (!building) return buildingId;
  const group = groupBuildingsForSelection(buildings).find((g) =>
    g.buildingIds.includes(buildingId),
  );
  return group?.primaryBuildingId ?? buildingId;
}

export interface BuildingListFilters {
  nameQuery: string;
  streetQuery: string;
}

export function filterBuildings(
  buildings: Building[],
  filters: BuildingListFilters,
): Building[] {
  const nameQuery = normalizePropertyPart(filters.nameQuery);
  const streetQuery = normalizePropertyPart(filters.streetQuery);

  return buildings.filter((building) => {
    const matchesName =
      !nameQuery || normalizePropertyPart(building.name).includes(nameQuery);
    const matchesStreet =
      !streetQuery || normalizePropertyPart(building.street_address).includes(streetQuery);
    return matchesName && matchesStreet;
  });
}

export function formatGroupedBuildingLabel(group: GroupedBuildingOption): string {
  return group.name;
}
