import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

/**
 * Global keyboard shortcuts hook
 * 
 * Currently supports:
 * - Double ESC: Navigate to dashboard (quick escape to home)
 * 
 * Features:
 * - Intelligent context detection (won't interfere with forms/dialogs)
 * - 500ms window for double-press detection
 * - Toast notification for user feedback
 * - Works across all pages and components
 */
export function useGlobalKeyboard() {
  const navigate = useNavigate();
  const lastEscPressRef = useRef<number>(0);
  const escTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle double ESC for dashboard navigation
      if (event.key === 'Escape') {
        // Don't trigger when user is typing in form elements
        const activeElement = document.activeElement;
        const isTyping = activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.getAttribute('contenteditable') === 'true'
        );
        
        // Don't trigger when modals/dialogs might be open (they usually have ESC handlers)
        const hasOpenDialog = document.querySelector('[role="dialog"]');
        
        if (isTyping || hasOpenDialog) {
          return; // Let the normal ESC behavior handle these cases
        }

        const now = Date.now();
        const timeSinceLastEsc = now - lastEscPressRef.current;
        
        // If ESC was pressed within 500ms, it's a double press
        if (timeSinceLastEsc < 500) {
          // Clear any existing timeout
          if (escTimeoutRef.current) {
            clearTimeout(escTimeoutRef.current);
            escTimeoutRef.current = null;
          }
          
          // Store current dashboard tab for retention
          const currentPath = window.location.pathname;
          console.log('Double ESC - Current path:', currentPath);
          
          // Get the last known dashboard tab from sessionStorage
          const currentDashboardTab = sessionStorage.getItem('dashboard-current-tab');
          console.log('Current dashboard tab from storage:', currentDashboardTab);
          
          if (currentDashboardTab) {
            // Store it for retention
            sessionStorage.setItem('dashboard-retained-tab', currentDashboardTab);
            console.log('Stored tab for retention:', currentDashboardTab);
          } else {
            // Fallback to 'all' if no tab is stored
            sessionStorage.setItem('dashboard-retained-tab', 'all');
            console.log('No current tab found, defaulting to "all"');
          }
          
          // Set flag for app navigation before navigating
          sessionStorage.setItem('dashboard-app-navigation', 'true');
          
          // Navigate to dashboard
          navigate('/');
          toast.success('Navigated to Dashboard', {
            description: 'Double ESC shortcut activated',
            duration: 2000
          });
          console.log('Double ESC detected - navigating to dashboard');
          
          // Reset the timer
          lastEscPressRef.current = 0;
        } else {
          // First ESC press - start timer
          lastEscPressRef.current = now;
          
          // Clear previous timeout if any
          if (escTimeoutRef.current) {
            clearTimeout(escTimeoutRef.current);
          }
          
          // Set timeout to reset after 500ms
          escTimeoutRef.current = setTimeout(() => {
            lastEscPressRef.current = 0;
            escTimeoutRef.current = null;
          }, 500);
        }
      }
    };

    // Add global event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (escTimeoutRef.current) {
        clearTimeout(escTimeoutRef.current);
      }
    };
  }, [navigate]);
}