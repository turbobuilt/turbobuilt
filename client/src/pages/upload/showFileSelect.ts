export function showFileSelect() {
    // Create a new file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.style.display = 'none'; // Hide the element

    // Append it to the body (required for triggering the file dialog)
    document.body.appendChild(fileInput);

    // Add an event listener to handle file selection
    fileInput.addEventListener('change', () => {
        console.log('File selected:', fileInput.files[0]);
        // Remove the input element after file selection
        document.body.removeChild(fileInput);
    });

    // Add an event listener to handle file selection cancelation
    fileInput.addEventListener('click', () => {
        // Remove the input element if it's clicked again without selecting any file
        function checkAndRemoveFileInput() {
            if (!fileInput.files.length) {
                document.body.removeChild(fileInput);
            }
        }
        window.addEventListener('focus', checkAndRemoveFileInput, { once: true });
    });

    // Trigger the file select dialog
    fileInput.click();
}