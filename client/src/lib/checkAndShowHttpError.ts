import { showAlert } from "../components/ShowModal/showModal";

/**
 * Checks the HTTP response for an error and displays an alert if an error is found.
 *
 * @param response - The HTTP response object to check for errors.
 * @returns `true` if an error is found and an alert is shown, otherwise `false`.
 */
export function checkAndShowHttpError(response) {
    if(response.error) {
        // alert(response.error);
        showAlert({ title: "Error", content: response.error });
        return true;
    }
    return false;
}