/**
 * Event Emitter for decoupled module communication.
 *
 * This allows modules to communicate without direct dependencies,
 * preventing circular dependencies and improving modularity.
 */
type Listener<T> = (data: T) => void;
declare class EventEmitter<E extends Record<string, unknown>> {
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
interface FormEvents extends Record<string, unknown> {
    'branch:change': {
        targetStepId: string;
    };
    'branch:show': {
        stepId: string;
    };
    'branch:hide': {
        stepId: string;
    };
    'skip:request': {
        targetStepId: string | null;
    };
    'step:change': {
        currentStepIndex: number;
        currentStepId: string;
        navigatedSteps?: string[];
        isBranchStep?: boolean;
    };
    'step:navigate': {
        targetStepId?: string;
        reason?: string;
    };
    'form:submit': Record<string, never>;
    'field:input': {
        fieldName: string;
        value: string | string[];
        element: HTMLElement;
        eventType: string;
    };
    'field:change': {
        fieldName: string;
        value: string | string[];
        element: HTMLElement;
        eventType: string;
    };
    'field:blur': {
        fieldName: string;
        value: string | string[];
        element: HTMLElement;
        eventType: string;
    };
}
export declare const formEvents: EventEmitter<FormEvents>;
export {};
//# sourceMappingURL=events.d.ts.map