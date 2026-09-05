import React, { useState, useEffect, useRef } from 'react';
import './CommandPalette.css';
import {
  SearchIcon,
  CanvasIcon,
  ActivityIcon,
  SettingsIcon,
  SunIcon,
  MoonIcon,
  CommandIcon,
  BoxIcon,
  CodeIcon,
  HomeIcon,
} from './Icon';
import { AppTab, CanvasSettings } from '../../App';
import { getModKey, getAltKey, getShiftKey } from '../../utils/platform';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  canvasSettings: CanvasSettings;
  toggleGrid: () => void;
  toggleSnap: () => void;
  setActiveTab: (tab: AppTab) => void;
  showLandingPage?: () => void;
}

interface CommandItem {
  id: string;
  category: 'Navigation' | 'Canvas Controls' | 'Preferences';
  title: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  theme,
  toggleTheme,
  sidebarOpen,
  toggleSidebar,
  canvasSettings,
  toggleGrid,
  toggleSnap,
  setActiveTab,
  showLandingPage,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const items: CommandItem[] = [
    {
      id: 'nav-canvas',
      category: 'Navigation',
      title: 'Go to Canvas Workspace',
      shortcut: `${getModKey()} 1`,
      icon: <CanvasIcon size={16} />,
      action: () => setActiveTab('canvas'),
    },
    {
      id: 'nav-home',
      category: 'Navigation',
      title: 'Go to Home Dashboard',
      shortcut: `${getModKey()} 2`,
      icon: <HomeIcon size={16} />,
      action: () => setActiveTab('home'),
    },
    {
      id: 'nav-profile',
      category: 'Navigation',
      title: 'Go to Profile Page',
      icon: <BoxIcon size={16} />,
      action: () => setActiveTab('profile'),
    },
    {
      id: 'nav-achievements',
      category: 'Navigation',
      title: 'View Achievements Catalog',
      icon: <CanvasIcon size={16} />,
      action: () => setActiveTab('achievements'),
    },
    {
      id: 'nav-challenges',
      category: 'Navigation',
      title: 'View Challenges Catalog',
      icon: <ActivityIcon size={16} />,
      action: () => setActiveTab('challenges'),
    },
    {
      id: 'nav-variables',
      category: 'Navigation',
      title: 'Go to Variables & Logic',
      shortcut: `${getModKey()} 3`,
      icon: <CodeIcon size={16} />,
      action: () => setActiveTab('variables'),
    },
    {
      id: 'nav-activity',
      category: 'Navigation',
      title: 'View System Activity Logs',
      shortcut: `${getModKey()} 4`,
      icon: <ActivityIcon size={16} />,
      action: () => setActiveTab('activity'),
    },
    {
      id: 'nav-settings',
      category: 'Navigation',
      title: 'Open Settings',
      shortcut: `${getModKey()} 5`,
      icon: <SettingsIcon size={16} />,
      action: () => setActiveTab('settings'),
    },
    {
      id: 'nav-api-test',
      category: 'Navigation',
      title: 'Dev: Open AI API Test Page',
      icon: <CodeIcon size={16} />,
      action: () => setActiveTab('api-test'),
    },
    {
      id: 'canvas-toggle-grid',
      category: 'Canvas Controls',
      title: canvasSettings.gridVisible ? 'Hide Canvas Grid Lines' : 'Show Canvas Grid Lines',
      shortcut: `${getModKey()} G`,
      icon: <BoxIcon size={16} />,
      action: () => toggleGrid(),
    },
    {
      id: 'canvas-toggle-snap',
      category: 'Canvas Controls',
      title: canvasSettings.gridSnap ? 'Disable Snap to Grid' : 'Enable Snap to Grid',
      shortcut: `${getShiftKey()} S`,
      icon: <BoxIcon size={16} />,
      action: () => toggleSnap(),
    },
    {
      id: 'pref-toggle-sidebar',
      category: 'Preferences',
      title: sidebarOpen ? 'Collapse Left Sidebar' : 'Expand Left Sidebar',
      shortcut: `${getModKey()} B`,
      icon: <CommandIcon size={16} />,
      action: () => toggleSidebar(),
    },
    {
      id: 'pref-toggle-theme',
      category: 'Preferences',
      title: `Switch Theme to ${theme === 'dark' ? 'Light Minimal' : 'Deep Space Dark'}`,
      shortcut: `${getAltKey()} T`,
      icon: theme === 'dark' ? <SunIcon size={16} /> : <MoonIcon size={16} />,
      action: () => toggleTheme(),
    },
    {
      id: 'pref-show-landing',
      category: 'Preferences',
      title: 'Show Landing Page Hero',
      shortcut: `${getModKey()} 0`,
      icon: <HomeIcon size={16} />,
      action: () => showLandingPage && showLandingPage(),
    },
  ];

  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
        onClose();
      }
    }
  };

  // Group items by category
  const categories = Array.from(new Set(filteredItems.map((i) => i.category)));

  let globalIndexCounter = 0;

  return (
    <div className="cmd-overlay" onClick={onClose}>
      <div className="cmd-container" onClick={(e) => e.stopPropagation()}>
        {/* Search Bar Input */}
        <div className="cmd-search-wrapper">
          <SearchIcon size={18} className="cmd-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="cmd-input"
            placeholder="Type a command or search workspace..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* Command List Options */}
        <div className="cmd-list">
          {filteredItems.length === 0 ? (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-dimmed)', fontSize: '13px' }}>
              No commands found matching "{query}"
            </div>
          ) : (
            categories.map((cat) => {
              const catItems = filteredItems.filter((i) => i.category === cat);
              return (
                <div key={cat} className="cmd-group">
                  <div className="cmd-group-title">{cat}</div>
                  {catItems.map((item) => {
                    const isSelected = globalIndexCounter === selectedIndex;
                    const currentIndex = globalIndexCounter;
                    globalIndexCounter++;

                    return (
                      <div
                        key={item.id}
                        className={`cmd-item ${isSelected ? 'active' : ''}`}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                        onClick={() => {
                          item.action();
                          onClose();
                        }}
                      >
                        <div className="cmd-item-left">
                          <span className="cmd-item-icon">{item.icon}</span>
                          <span className="cmd-item-name">{item.title}</span>
                        </div>
                        {item.shortcut && (
                          <div className="cmd-shortcut">
                            <span className="cmd-shortcut-key">{item.shortcut}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hints */}
        <div className="cmd-footer">
          <span>AutomataVerse Command Palette</span>
          <div className="cmd-footer-hints">
            <span className="cmd-hint">
              <span className="cmd-hint-key">↑↓</span> Navigate
            </span>
            <span className="cmd-hint">
              <span className="cmd-hint-key">↵</span> Select
            </span>
            <span className="cmd-hint">
              <span className="cmd-hint-key">esc</span> Close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
