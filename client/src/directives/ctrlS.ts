export default {
    beforeMount(el, binding) {
        const handler = (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault();
                binding.value();
            }
        };
        document.body.addEventListener('keydown', handler);
        el._ctrlSHandler = handler; // Store the handler for cleanup
    },
    unmounted(el) {
        document.body.removeEventListener('keydown', el._ctrlSHandler);
    }
}