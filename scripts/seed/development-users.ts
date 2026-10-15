/** Development-only accounts used by the explicit local database seed. */
export const developmentUsers = [
  {
    name: 'Alex Morgan',
    email: 'planner@gatherory.test',
    password: 'password',
  },
  {
    name: 'Jordan Lee',
    email: 'jordan@gatherory.test',
    password: 'password',
  },
  {
    name: 'Maya Chen',
    email: 'coordinator@gatherory.test',
    password: 'password',
  },
  {
    name: 'Sam Rivera',
    email: 'guest@gatherory.test',
    password: 'password',
  },
  // This is intentionally a local review fixture. Keep the actual App Review
  // credentials in App Store Connect; this seed always refuses production.
  {
    name: 'Gatherory App Review',
    email: 'appreview@gatherory.test',
    password: 'password',
  },
  {
    name: 'Taylor Brooks',
    email: 'reception-planner@gatherory.test',
    password: 'password',
  },
  {
    name: 'Casey Patel',
    email: 'pending-collaborator@gatherory.test',
    password: 'password',
  },
  {
    name: 'Riley Kim',
    email: 'latest-collaborator@gatherory.test',
    password: 'password',
  },
] as const
