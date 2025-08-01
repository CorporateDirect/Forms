/**
 * Event Emitter for decoupled module communication.
 *
 * This allows modules to communicate without direct dependencies,
 * preventing circular dependencies and improving modularity.
 */

type Listener<T> = (data: T) => void;

interface ModuleState {
  initialized: boolean;
  name: string;
}

class EventEmitter<E extends Record<string, unknown>> {
  private events: { [K in keyof E]?: Listener<E[K]>[] } = {};
  private moduleStates: Map<string, ModuleState> = new Map();

  /**
   * Register a module as initialized
   */
  public registerModule(name: string): void {
    this.moduleStates.set(name, { initialized: true, name });
  }

  /**
   * Unregister a module (when it's being reset)
   */
  public unregisterModule(name: string): void {
    this.moduleStates.delete(name);
  }

  /**
   * Check if a module is initialized
   */
  public isModuleInitialized(name: string): boolean {
    return this.moduleStates.get(name)?.initialized ?? false;
  }

  /**
   * Register an event listener.
   */
  public on<K extends keyof E>(event: K, listener: Listener<E[K]>): () => void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event]!.push(listener);

    // Return a function to unsubscribe
    return () => {
      this.off(event, listener);
    };
  }

  /**
   * Unregister an event listener.
   */
  public off<K extends keyof E>(event: K, listener: Listener<E[K]>): void {
    if (!this.events[event]) {
      return;
    }
    this.events[event] = this.events[event]!.filter(l => l !== listener);
  }

  /**
   * Emit an event to all registered listeners with validation.
   */
  public emit<K extends keyof E>(event: K, data: E[K]): void {
    const eventName = String(event);
    
    console.log(`🔄 [FormEvents] Emitting event: ${eventName}`, {
      eventData: data,
      timestamp: new Date().toISOString(),
      hasListeners: !!this.events[event],
      listenerCount: this.events[event]?.length || 0
    });

    if (!this.events[event]) {
      console.warn(`⚠️ [FormEvents] No listeners registered for event: ${eventName}`);
      return;
    }

    // Validate that required modules are initialized for critical events
    if (event === 'skip:request' && !this.isModuleInitialized('multiStep')) {
      console.error(`❌ [FormEvents] CRITICAL: Skipping '${eventName}' event - multiStep module not initialized`, {
        eventData: data,
        registeredModules: Array.from(this.moduleStates.keys()),
        multiStepState: this.moduleStates.get('multiStep')
      });
      return;
    }

    if (event === 'branch:change' && !this.isModuleInitialized('multiStep')) {
      console.error(`❌ [FormEvents] CRITICAL: Skipping '${eventName}' event - multiStep module not initialized`, {
        eventData: data,
        registeredModules: Array.from(this.moduleStates.keys()),
        multiStepState: this.moduleStates.get('multiStep')
      });
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    this.events[event]!.forEach((listener, index) => {
      try {
        console.log(`📡 [FormEvents] Calling listener ${index + 1}/${this.events[event]!.length} for ${eventName}`);
        listener(data);
        successCount++;
        console.log(`✅ [FormEvents] Listener ${index + 1} completed successfully for ${eventName}`);
      } catch (error) {
        errorCount++;
        console.error(`💥 [FormEvents] LISTENER ERROR ${index + 1}/${this.events[event]!.length} for '${eventName}':`, {
          error: error,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          eventData: data,
          listenerIndex: index
        });
      }
    });

    console.log(`📊 [FormEvents] Event ${eventName} completed:`, {
      totalListeners: this.events[event]!.length,
      successful: successCount,
      failed: errorCount,
      eventData: data
    });
  }
}

// Define event types
interface FormEvents extends Record<string, unknown> {
  'branch:change': { targetStepId: string };
  'branch:show': { stepId: string };
  'branch:hide': { stepId: string };
  'skip:request': { targetStepId: string | null };
  'step:change': { 
    currentStepIndex: number; 
    currentStepId: string; 
    navigatedSteps?: string[];
    isBranchStep?: boolean;
  };
  'step:navigate': { targetStepId?: string; reason?: string };
  'form:submit': Record<string, never>;
  'field:input': { fieldName: string; value: string | string[]; element: HTMLElement; eventType: string; };
  'field:change': { fieldName: string; value: string | string[]; element: HTMLElement; eventType: string; };
  'field:blur': { fieldName: string; value: string | string[]; element: HTMLElement; eventType: string; };
}

// Create and export a singleton instance
export const formEvents = new EventEmitter<FormEvents>(); 