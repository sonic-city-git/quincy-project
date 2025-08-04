/**
 * 🎨 DESIGN TOKEN USAGE EXAMPLES
 * 
 * Shows how to use the new design token system in practice
 * Demonstrates migration from hardcoded values to tokens
 */

import { useState } from 'react';
import { 
  createCardClass, 
  createButtonClass, 
  createInputClass,
  createStatusClass,
  STATUS_PATTERNS,
  RESPONSIVE_PATTERNS
} from '@/constants/design-system';
import { 
  SEMANTIC_COLORS, 
  SPACING, 
  SHAPES, 
  TYPOGRAPHY,
  ANIMATIONS
} from '@/constants/design-tokens';
import { Calendar, AlertTriangle, CheckCircle, User } from 'lucide-react';

// ========== EXAMPLE 1: StatusCard Using Design Tokens ==========

interface TokenStatusCardProps {
  title: string;
  value: number;
  status: keyof typeof STATUS_PATTERNS;
  subtitle?: string;
}

function TokenStatusCard({ title, value, status, subtitle }: TokenStatusCardProps) {
  const statusClasses = createStatusClass(status, ['background', 'border', 'text']);
  
  return (
    <div className={`
      ${createCardClass('compact')}
      ${statusClasses}
      relative overflow-hidden
    `}>
      {/* Priority bar for critical/warning */}
      {(status === 'critical' || status === 'warning') && value > 0 && (
        <div className={`absolute top-0 left-0 w-full h-1 ${STATUS_PATTERNS[status].accent}`} />
      )}
      
      <div className="text-center space-y-1">
        <div className={`mx-auto w-8 h-8 rounded-lg bg-background/20 flex items-center justify-center`}>
          <AlertTriangle className={`h-4 w-4 ${STATUS_PATTERNS[status].text}`} />
        </div>
        <p className={`text-lg font-bold ${STATUS_PATTERNS[status].text}`}>
          {value}
        </p>
        <p className="text-xs font-medium truncate">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground/60 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// ========== EXAMPLE 2: Project Card Using Design Tokens ==========

interface TokenProjectCardProps {
  project: {
    id: string;
    name: string;
    type: string;
    owner: string;
    color?: string;
  };
  onClick: () => void;
}

function TokenProjectCard({ project, onClick }: TokenProjectCardProps) {
  return (
    <div 
      className={`
        ${createCardClass('default')}
        cursor-pointer
        group
      `}
      onClick={onClick}
    >
      <div className="space-y-3">
        {/* Header with icon */}
        <div className="flex items-center gap-3">
          <div className={`
            w-8 h-8 rounded-lg 
            bg-[${SEMANTIC_COLORS.background.tertiary}] 
            flex items-center justify-center
          `}>
            <Calendar className={`h-4 w-4 text-[${SEMANTIC_COLORS.interactive.primary}]`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`
              text-sm font-medium truncate
              text-[${SEMANTIC_COLORS.text.primary}]
            `}>
              {project.name}
            </h3>
            <p className={`
              text-xs truncate
              text-[${SEMANTIC_COLORS.text.secondary}]
            `}>
              {project.type}
            </p>
          </div>
        </div>
        
        {/* Content */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span>{project.owner}</span>
          </div>
          
          {/* Project color indicator */}
          {project.color && (
            <div 
              className={`
                h-2 w-full rounded-full
                transition-opacity duration-200
                group-hover:opacity-80
              `}
              style={{ backgroundColor: project.color }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ========== EXAMPLE 3: Form Using Design Tokens ==========

function TokenForm() {
  const [formData, setFormData] = useState({
    name: '',
    type: 'all',
    owner: 'all'
  });

  return (
    <div className={`${createCardClass('default')} space-y-4`}>
      <h3 className={`
        text-lg font-semibold
        text-[${SEMANTIC_COLORS.text.primary}]
      `}>
        Add New Project
      </h3>
      
      <div className="space-y-3">
        {/* Name input */}
        <div>
          <label className={`
            block text-sm font-medium mb-1
            text-[${SEMANTIC_COLORS.text.secondary}]
          `}>
            Project Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter project name..."
            className={createInputClass('default')}
          />
        </div>
        
        {/* Type select */}
        <div>
          <label className={`
            block text-sm font-medium mb-1
            text-[${SEMANTIC_COLORS.text.secondary}]
          `}>
            Project Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className={createInputClass('default')}
          >
            <option value="all">All Types</option>
            <option value="tv">TV Production</option>
            <option value="festival">Festival</option>
            <option value="touring">Touring</option>
          </select>
        </div>
        
        {/* Actions */}
        <div className={RESPONSIVE_PATTERNS.flex.actions}>
          <button className={createButtonClass('secondary')}>
            Cancel
          </button>
          <button className={createButtonClass('primary')}>
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
}

// ========== EXAMPLE 4: Table Using Design Tokens ==========

function TokenTable() {
  const projects = [
    { id: '1', name: 'Summer Festival 2024', type: 'Festival', owner: 'John Doe' },
    { id: '2', name: 'TV Series Production', type: 'TV', owner: 'Jane Smith' },
    { id: '3', name: 'Concert Tour', type: 'Touring', owner: 'Mike Johnson' }
  ];

  return (
    <div className={`
      rounded-[${SHAPES.borderRadius.lg}]
      overflow-hidden
      border border-[${SEMANTIC_COLORS.border.default}]
      shadow-[${SHAPES.shadows.darkSm}]
    `}>
      {/* Header */}
      <div className={`
        bg-[${SEMANTIC_COLORS.background.tertiary}]
        border-b border-[${SEMANTIC_COLORS.border.default}]
      `}>
        <div className="grid grid-cols-3 gap-4">
          <div className={`
            p-[${SPACING[4]}]
            text-[${TYPOGRAPHY.fontSize.sm[0]}]
            font-medium
            text-[${SEMANTIC_COLORS.text.secondary}]
          `}>
            Project Name
          </div>
          <div className={`
            p-[${SPACING[4]}]
            text-[${TYPOGRAPHY.fontSize.sm[0]}]
            font-medium
            text-[${SEMANTIC_COLORS.text.secondary}]
          `}>
            Type
          </div>
          <div className={`
            p-[${SPACING[4]}]
            text-[${TYPOGRAPHY.fontSize.sm[0]}]
            font-medium
            text-[${SEMANTIC_COLORS.text.secondary}]
          `}>
            Owner
          </div>
        </div>
      </div>
      
      {/* Rows */}
      <div>
        {projects.map((project) => (
          <div
            key={project.id}
            className={`
              border-b border-[${SEMANTIC_COLORS.border.subtle}]
              transition-[${ANIMATIONS.transitions.colors}]
              hover:bg-[${SEMANTIC_COLORS.background.tertiary}]
              cursor-pointer
            `}
          >
            <div className="grid grid-cols-3 gap-4">
              <div className={`
                p-[${SPACING[4]}]
                text-[${TYPOGRAPHY.fontSize.sm[0]}]
                text-[${SEMANTIC_COLORS.text.primary}]
                font-medium
              `}>
                {project.name}
              </div>
              <div className={`
                p-[${SPACING[4]}]
                text-[${TYPOGRAPHY.fontSize.sm[0]}]
                text-[${SEMANTIC_COLORS.text.secondary}]
              `}>
                {project.type}
              </div>
              <div className={`
                p-[${SPACING[4]}]
                text-[${TYPOGRAPHY.fontSize.sm[0]}]
                text-[${SEMANTIC_COLORS.text.secondary}]
              `}>
                {project.owner}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ========== MAIN EXAMPLE COMPONENT ==========

export default function DesignTokenExample() {
  return (
    <div className={`
      min-h-screen 
      bg-[${SEMANTIC_COLORS.background.primary}] 
      p-[${SPACING[6]}]
    `}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className={`
            text-3xl font-bold
            text-[${SEMANTIC_COLORS.text.primary}]
          `}>
            Design Token System Examples
          </h1>
          <p className={`
            text-lg
            text-[${SEMANTIC_COLORS.text.secondary}]
          `}>
            All components use centralized design tokens for easy theming
          </p>
        </div>
        
        {/* Status Cards Grid */}
        <div>
          <h2 className={`
            text-xl font-semibold mb-4
            text-[${SEMANTIC_COLORS.text.primary}]
          `}>
            Status Cards (Dashboard Style)
          </h2>
          <div className={RESPONSIVE_PATTERNS.grid.stats}>
            <TokenStatusCard 
              title="Critical Issues" 
              value={3} 
              status="critical"
              subtitle="Needs immediate attention"
            />
            <TokenStatusCard 
              title="Warnings" 
              value={7} 
              status="warning"
              subtitle="Review required"
            />
            <TokenStatusCard 
              title="Completed" 
              value={24} 
              status="success"
              subtitle="All systems normal"
            />
            <TokenStatusCard 
              title="In Progress" 
              value={12} 
              status="info"
              subtitle="Currently active"
            />
          </div>
        </div>
        
        {/* Project Cards */}
        <div>
          <h2 className={`
            text-xl font-semibold mb-4
            text-[${SEMANTIC_COLORS.text.primary}]
          `}>
            Project Cards
          </h2>
          <div className={RESPONSIVE_PATTERNS.grid.cards}>
            <TokenProjectCard 
              project={{
                id: '1',
                name: 'Summer Festival 2024',
                type: 'Festival',
                owner: 'John Doe',
                color: SEMANTIC_COLORS.interactive.primary
              }}
              onClick={() => console.log('Project clicked')}
            />
            <TokenProjectCard 
              project={{
                id: '2',
                name: 'TV Series Production',
                type: 'TV Production',
                owner: 'Jane Smith',
                color: SEMANTIC_COLORS.interactive.accent
              }}
              onClick={() => console.log('Project clicked')}
            />
            <TokenProjectCard 
              project={{
                id: '3',
                name: 'Concert Tour',
                type: 'Touring',
                owner: 'Mike Johnson'
              }}
              onClick={() => console.log('Project clicked')}
            />
          </div>
        </div>
        
        {/* Form Example */}
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className={`
              text-xl font-semibold mb-4
              text-[${SEMANTIC_COLORS.text.primary}]
            `}>
              Form Components
            </h2>
            <TokenForm />
          </div>
          
          <div>
            <h2 className={`
              text-xl font-semibold mb-4
              text-[${SEMANTIC_COLORS.text.primary}]
            `}>
              Table Components
            </h2>
            <TokenTable />
          </div>
        </div>
        
        {/* Token Info */}
        <div className={`
          ${createCardClass('default')}
          text-center
        `}>
          <CheckCircle className={`
            h-12 w-12 mx-auto mb-4
            text-[${SEMANTIC_COLORS.interactive.primary}]
          `} />
          <h3 className={`
            text-lg font-semibold mb-2
            text-[${SEMANTIC_COLORS.text.primary}]
          `}>
            All Styling From Design Tokens! 🎉
          </h3>
          <p className={`
            text-[${SEMANTIC_COLORS.text.secondary}]
            max-w-2xl mx-auto
          `}>
            Change colors, spacing, borders, or any other design aspect by updating 
            the design token values. Every component will automatically reflect the changes!
          </p>
        </div>
      </div>
    </div>
  );
}