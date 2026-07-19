// ─────────────────────────────────────────────────────────────
// Barrel file — re-exports every admin page so the route files
// keep a single stable import path.
// ─────────────────────────────────────────────────────────────
export { Clients } from './Clients';
export { ClientProfile } from './ClientProfile';
export { Portfolios } from './Portfolios';
export { Transactions } from './Transactions';
export { Messages } from './Messages';
export { Content } from './ContentHub';
export { Reports } from './Reports';
export { Team } from './Team';
export { Notifications } from './Notifications';
export { Security } from './Security';
export { SettingsPage } from './Settings';
export { SubAdmins } from './SubAdmins';
export { CalendarPage } from './Calendar';
export { Tasks } from './Tasks';
export { GlobalSearch } from './GlobalSearch';

// Website Content Management
export { HeroManager } from './cms/HeroManager';
export { ServicesManager } from './cms/ServicesManager';
export { MarketsManager } from './cms/MarketsManager';
export { FAQManager } from './cms/FAQManager';
export { TestimonialsManager } from './cms/TestimonialsManager';
export { AboutManager } from './cms/AboutManager';
export { SiteDesign } from './cms/SiteDesign';
export { PrivacyPolicyManager } from './cms/PrivacyPolicyManager';
