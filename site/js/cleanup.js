import * as db from './database.js';

export function setupCleanupButton() {
    /* The host will have a visible button to cleanup the database */
    const cleanupButton = document.getElementById("cleanup-button");
    cleanupButton.hidden = false;

    cleanupButton.addEventListener("click", async () => {
        const confirmed = window.confirm(
            "Are you sure you want to delete the game? This can't be undone."
        );

        if (!confirmed) return;

        await db.clearDatabase();
    });
}
