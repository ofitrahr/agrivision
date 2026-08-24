import {
  CircleDollarSign, UtensilsCrossed, Heart, BookOpen, UserCheck,
  Droplets, Zap, Briefcase, Cog, Scale, Building2, Recycle,
  Globe, Fish, TreePine, Gavel, Handshake
} from 'lucide-react';

export const SDG_META = [
  { goal_number: 1, name: 'No Poverty', color: '#E5243B', icon: CircleDollarSign },
  { goal_number: 2, name: 'Zero Hunger', color: '#DDA63A', icon: UtensilsCrossed },
  { goal_number: 3, name: 'Good Health & Well-being', color: '#4C9F38', icon: Heart },
  { goal_number: 4, name: 'Quality Education', color: '#C5192D', icon: BookOpen },
  { goal_number: 5, name: 'Gender Equality', color: '#FF3A21', icon: UserCheck },
  { goal_number: 6, name: 'Clean Water & Sanitation', color: '#26BDE2', icon: Droplets },
  { goal_number: 7, name: 'Affordable & Clean Energy', color: '#FCC30B', icon: Zap },
  { goal_number: 8, name: 'Decent Work & Economic Growth', color: '#A21942', icon: Briefcase },
  { goal_number: 9, name: 'Industry, Innovation & Infrastructure', color: '#FD6925', icon: Cog },
  { goal_number: 10, name: 'Reduced Inequalities', color: '#DD1367', icon: Scale },
  { goal_number: 11, name: 'Sustainable Cities & Communities', color: '#FD9D24', icon: Building2 },
  { goal_number: 12, name: 'Responsible Consumption & Production', color: '#BF8B2E', icon: Recycle },
  { goal_number: 13, name: 'Climate Action', color: '#3F7E44', icon: Globe },
  { goal_number: 14, name: 'Life Below Water', color: '#0A97D9', icon: Fish },
  { goal_number: 15, name: 'Life on Land', color: '#56C02B', icon: TreePine },
  { goal_number: 16, name: 'Peace, Justice & Strong Institutions', color: '#00689D', icon: Gavel },
  { goal_number: 17, name: 'Partnerships for the Goals', color: '#19486A', icon: Handshake },
];

export const getSdgMeta = (goalNumber) => SDG_META.find(m => m.goal_number === goalNumber)
  || { goal_number: goalNumber, name: `Goal ${goalNumber}`, color: '#6C757D', icon: Building2 };