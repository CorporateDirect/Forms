/**
 * Event Emitter for decoupled module communication.
 *
 * This allows modules to communicate without direct dependencies,
 * preventing circular dependencies and improving modularity.
 */
type Listener<T> = (data: T) => void;
declare class EventEmitter<E extends Record<string, any>> {
    private events;
    private moduleStates;
    /**
     * Register a module as initialized
     */
    registerModule(name: string): void;
    /**
     * Unregister a module (when it's being reset)
     */
    unregisterModule(name: string): void;
    /**
     * Check if a module is initialized
     */
    isModuleInitialized(name: string): boolean;
    /**
     * Register an event listener.
     */
    on<K extends keyof E>(event: K, listener: Listener<E[K]>): () => void;
    /**
     * Unregister an event listener.
     */
    off<K extends keyof E>(event: K, listener: Listener<E[K]>): void;
    /**
     * Emit an event to all registered listeners with validation.
     */
    emit<K extends keyof E>(event: K, data: E[K]): void;
}
interface FormEvents {
    'branch:change': {
        targetStepId: string;
    };
    'skip:request': {
        targetStepId: string | null;
    };
    'step:change': {
        currentStepIndex: number;
        currentStepId: string;
    };
    'form:submit': Record<string, never>;
}
export declare const formEvents: EventEmitter<FormEvents>;
export {};
//# sourceMappingURL=events.d.ts.map