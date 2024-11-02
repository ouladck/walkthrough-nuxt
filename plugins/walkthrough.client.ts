import WModal from "@/components/WModal.vue";
import { createApp, type App } from "vue";

// Step options
export interface Step {
    element: string;
    title?: string;
    content: string;
    prevText?: string,
    nextText?: string,
    finishText?: string,
    nextCallback?: () => void;
    prevCallback?: () => void;
}
// Walkthrough options
export interface Options {
    prevText?: string,
    nextText?: string,
    finishText?: string,
}

export default defineNuxtPlugin(nuxtApp => {
    const index = ref(1);
    const steps = reactive<Step[]>([]);
    const options = reactive<Options>({ prevText: 'Previous', nextText: 'Next', finishText: 'Finish' });
    const step = computed<Step>(() => steps[index.value - 1]);
    const element = ref('body');
    const isVisible = ref(false);
    const stepsCount = ref(0);
    const title = ref('');
    const content = ref('');
    const startText = ref('Start');
    const prevText = ref('Previous');
    const nextText = ref('Next');
    const finishText = ref('Finish');
    const modalInstance = ref<App<Element> | null>(null);
    //this.renderModal(step.value);


    const initWalkthrough = (opts: Options, stepList: Step[]) => {
        Object.assign(options, opts);
        steps.splice(0, steps.length, ...stepList);

        prevText.value = options.prevText ?? prevText.value;
        nextText.value = options.nextText ?? nextText.value;
        finishText.value = options.finishText ?? finishText.value;

        stepsCount.value = steps.length;
        index.value = 1;
        isVisible.value = true;

        renderModal(step.value);
        mountModal({ nextStep, prevStep, closeModal });

    };

    const nextStep = () => {
        step.value.nextCallback?.()
        if (index.value < stepsCount.value) {
            removePreviousStep()
            index.value++;
            renderModal(step.value);
            mountModal({ nextStep, prevStep, closeModal });
        }
    };

    const prevStep = () => {
        if (index.value > 1) {
            step.value.prevCallback?.()
            removePreviousStep()
            index.value--;
            renderModal(step.value);
            mountModal({ nextStep, prevStep, closeModal });
        }
    };

    const closeModal = () => {
        isVisible.value = false;
        removePreviousStep()

    };

    const renderModal = (step: Step) => {
        title.value = step.title ?? '';
        content.value = step.content;
        element.value = step.element;
    }
    const removePreviousStep =() => {
        if (modalInstance.value) {
            modalInstance.value!.unmount();
            modalInstance.value = null;
            document.querySelector('.walkthrough-modal-container')!?.remove();
            document.querySelector('.walkthrough-highlight')!?.classList.remove('walkthrough-highlight')
        }
    }

    const mountModal = (handlers: { nextStep: Function, prevStep: Function, closeModal: Function }) => {
        removePreviousStep();
        const modalContainer = document.createElement('div');
        modalContainer.classList.add('walkthrough-modal-container');
        modalContainer.style.position = 'absolute';
        modalContainer.style.top = '0';
        const selector: HTMLElement = document.querySelector(element.value)!;
        if (!selector) {
            console.error(`Element not found: ${element.value}`);
            return;
        }
        selector.classList.add('walkthrough-highlight');
        selector.appendChild(modalContainer);
        const step = computed<Step>(() => steps[index.value - 1])


        modalInstance!.value = createApp(WModal, {
            element: element.value,
            index: index.value,
            stepsCount: stepsCount.value,
            isVisible: isVisible.value,
            title: title.value,
            content: content.value,
            prevText: step.value.prevText ?? prevText.value,
            nextText: step.value.nextText ?? nextText.value,
            finishText: step.value.finishText ?? finishText.value,
            onNext: handlers.nextStep,
            onPrev: handlers.prevStep,
            onClose: handlers.closeModal,
        });

        modalInstance.value!.mount(modalContainer);
        positionModal(selector, document.querySelector('.walkthrough-modal')!);
    }
    const adjustModalArrow = (isTop: boolean) => {
        const arrow = document.querySelector('.arrow')!
        const inner = document.querySelector('.inner')!
        if (isTop) {
            arrow.classList.remove('arrow-bottom')
            arrow.classList.add('arrow-top')
            inner.classList.remove('inner-bottom')
            inner.classList.add('inner-top')
        } else {
            arrow.classList.remove('arrow-top')
            arrow.classList.add('arrow-bottom')
            inner.classList.remove('inner-top')
            inner.classList.add('inner-bottom')
        }
    }
    const positionModal = (element: HTMLElement, modal: HTMLElement) => {
        const rect = element.getBoundingClientRect();
        const modalRect = modal.getBoundingClientRect();
        const margin = 10; // Margin to keep the modal a little inside the viewport

        // Calculate the default top position
        let top = -modalRect.height//rect.height + 20;
        const isTop = rect.top < modalRect.height

        // Adjusting the arrow in top or bottom of the modal
        adjustModalArrow(isTop)

        // If the modal is above the top of the viewport, place it below the element
        if (isTop) {
            top = rect.height + 20;
        }

        // Calculate the default left position
        let left = rect.left - rect.width - margin;

        // Ensure the modal doesn't go offscreen to the left
        if (left < margin) {
            left = margin;
        }

        // Ensure the modal doesn't go offscreen to the right
        if (left + modalRect.width > window.innerWidth) {
            left = window.innerWidth - modalRect.width;
        }
        
        modal.style.top = `${top}px`;
        modal.style.left = `${left}px`;
    }

    return {
        provide: {
            walkthrough: {
                init: initWalkthrough,
                closeModal,
                nextStep,
                prevStep
            }
        }
    }
});