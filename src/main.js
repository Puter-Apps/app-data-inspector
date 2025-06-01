const signInAndLoadBtn = document.getElementById('signInAndLoadBtn');
const buttonText = document.getElementById('buttonText');
const appSelectorContainer = document.getElementById('appSelectorContainer');
const appDataSelect = document.getElementById('appDataSelect');
const appDataOutput = document.getElementById('appDataOutput');
const statusMessage = document.getElementById('statusMessage');
const appPreview = document.getElementById('appPreview');
const appIcon = document.getElementById('appIcon');
const appName = document.getElementById('appName');
const appDescription = document.getElementById('appDescription');
const copyButton = document.getElementById('copyButton');
let inspectorAppsList = [];
let currentAppData = null;

function updateStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status ${type}`;
}

function showLoading() {
    buttonText.innerHTML = '<span class="loading-spinner"></span> Loading...';
}

function hideLoading() {
    buttonText.innerHTML = 'Sign In & Load Apps';
}

function updateAppPreview(app) {
    if (app.icon && app.icon.startsWith('data:image/')) {
        appIcon.src = app.icon;
    } else {
        // Create a simple default icon
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // Simple background
        ctx.fillStyle = '#f6f8fa';
        ctx.fillRect(0, 0, 128, 128);
        
        // Border
        ctx.strokeStyle = '#d1d9e0';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, 128, 128);
        
        // Add letter
        ctx.fillStyle = '#656d76';
        ctx.font = 'bold 48px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const letter = (app.title || app.name || 'A')[0].toUpperCase();
        ctx.fillText(letter, 64, 64);
        
        appIcon.src = canvas.toDataURL();
    }
    
    appName.textContent = app.title || app.name || 'Unnamed App';
    appDescription.textContent = app.description || 'No description available';
    appPreview.classList.add('visible');
}

function formatJSON(obj) {
    const json = JSON.stringify(obj, null, 2);
    return json
        .replace(/(".*?")\s*:/g, '<span class="json-key">$1</span>:')
        .replace(/:\s*(".*?")/g, ': <span class="json-string">$1</span>')
        .replace(/:\s*(true|false)/g, ': <span class="json-boolean">$1</span>')
        .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>')
        .replace(/:\s*(\d+)/g, ': <span class="json-number">$1</span>');
}

copyButton.addEventListener('click', () => {
    if (currentAppData) {
        navigator.clipboard.writeText(JSON.stringify(currentAppData, null, 2))
            .then(() => {
                copyButton.textContent = 'Copied!';
                setTimeout(() => {
                    copyButton.textContent = 'Copy JSON';
                }, 2000);
            })
            .catch(() => {
                copyButton.textContent = 'Failed';
                setTimeout(() => {
                    copyButton.textContent = 'Copy JSON';
                }, 2000);
            });
    }
});

signInAndLoadBtn.addEventListener('click', async () => {
    showLoading();
    updateStatus('Connecting to Puter...', 'info');
    signInAndLoadBtn.disabled = true;
    appSelectorContainer.style.display = 'none';
    appPreview.classList.remove('visible');
    appDataOutput.innerHTML = '<div class="placeholder-message">Loading applications...</div>';
    copyButton.style.display = 'none';

    try {
        // ===== PUTER SDK TUTORIAL =====
        // puter.auth.isSignedIn() checks if the user is currently authenticated with Puter
        // This is useful for determining if you need to show a login prompt
        // Returns a Promise that resolves to a boolean (true if signed in, false if not)
        console.log("API Call -> await puter.auth.isSignedIn()");
        if (!await puter.auth.isSignedIn()) {
            updateStatus('Please sign in to Puter...', 'info');
            
            // ===== PUTER SDK TUTORIAL =====
            // puter.auth.signIn() opens the Puter authentication dialog
            // This allows users to sign in with their existing Puter account
            // The Promise resolves when authentication is successful
            // Your app will receive the necessary auth tokens automatically
            console.log("API Call -> await puter.auth.signIn()");
            await puter.auth.signIn();
        }
        updateStatus('Authenticated! Loading your apps...', 'success');

        // ===== PUTER SDK TUTORIAL =====
        // puter.apps.list() retrieves all apps owned by the authenticated user
        // Returns an array of app objects containing metadata like name, icon, description, etc.
        // This is useful for building app galleries, launchers, or management tools
        console.log("API Call -> await puter.apps.list()");
        inspectorAppsList = await puter.apps.list();
        
        console.log("Full data received from puter.apps.list():");
        if (inspectorAppsList && inspectorAppsList.length > 0) {
            inspectorAppsList.forEach((app, index) => {
                console.log(`App ${index + 1} (${app.name || 'N/A'}):`, JSON.parse(JSON.stringify(app)));
            });
        } else {
            console.log("No apps returned by puter.apps.list().");
        }

        appDataSelect.innerHTML = '<option value="">-- Select an app --</option>';
        if (inspectorAppsList && inspectorAppsList.length > 0) {
            inspectorAppsList.forEach(app => {
                const option = document.createElement('option');
                option.value = app.uid;
                option.textContent = app.title || app.name || app.uid;
                appDataSelect.appendChild(option);
            });
            appSelectorContainer.style.display = 'block';
            updateStatus(`Successfully loaded ${inspectorAppsList.length} apps`, 'success');
            appDataOutput.innerHTML = '<div class="placeholder-message">Select an application from the dropdown above to view its detailed information</div>';
        } else {
            appDataSelect.innerHTML = '<option value="">-- No apps found --</option>';
            updateStatus('No apps found in your account', 'info');
            appDataOutput.innerHTML = '<div class="placeholder-message">No applications found in your account. Create some apps first!</div>';
        }
    } catch (err) {
        console.error("Error during sign-in or app load:", err);
        updateStatus(`Error: ${err.message}`, 'error');
        appDataOutput.innerHTML = `<div class="placeholder-message" style="color: #cf222e;">Error: ${err.message}</div>`;
    } finally {
        signInAndLoadBtn.disabled = false;
        hideLoading();
    }
});

appDataSelect.addEventListener('change', () => {
    const selectedAppUid = appDataSelect.value;
    
    if (selectedAppUid && inspectorAppsList.length > 0) {
        const selectedApp = inspectorAppsList.find(app => app.uid === selectedAppUid);
        if (selectedApp) {
            currentAppData = selectedApp;
            appDataOutput.innerHTML = formatJSON(selectedApp);
            updateAppPreview(selectedApp);
            updateStatus(`Displaying: ${selectedApp.title || selectedApp.name}`, 'success');
            copyButton.style.display = 'block';
        } else {
            appDataOutput.innerHTML = '<div class="placeholder-message" style="color: #cf222e;">Error: Selected app not found</div>';
            updateStatus('Could not find selected app data', 'error');
            copyButton.style.display = 'none';
        }
    } else if (!selectedAppUid) {
        appDataOutput.innerHTML = '<div class="placeholder-message">Select an application to view its details</div>';
        appPreview.classList.remove('visible');
        updateStatus('Please select an application from the dropdown', 'info');
        copyButton.style.display = 'none';
    } else {
        appDataOutput.innerHTML = '<div class="placeholder-message">Application list not loaded</div>';
        updateStatus('Application list is empty or not loaded', 'error');
        copyButton.style.display = 'none';
    }
});

// Auto-load if already signed in
(async () => {
    try {
        // ===== PUTER SDK TUTORIAL =====
        // Best Practice: Always check if the Puter SDK is available before using it
        // The 'typeof puter !== undefined' check prevents errors if the SDK fails to load
        // puter.auth.isSignedIn() is used here on page load to provide a seamless experience
        // This pattern allows you to automatically continue the user's session without requiring
        // them to sign in again if they already have an active session
        console.log("API Call (on page load) -> await puter.auth.isSignedIn()");
        if (typeof puter !== 'undefined' && await puter.auth.isSignedIn()) {
            console.log("User already signed in. Triggering app load.");
            signInAndLoadBtn.click();
        } else {
            console.log("User not signed in on page load.");
        }
    } catch(e) {
        console.error("Error on initial sign-in check:", e);
        updateStatus("Error checking authentication state", 'error');
    }
})();
