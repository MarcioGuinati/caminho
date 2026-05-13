const Alerts = {
    _createModalHTML: function() {
        if (document.getElementById('custom-modal')) return;
        
        const modalHTML = `
            <div id="custom-modal" class="custom-modal">
                <div class="modal-content">
                    <div id="modal-icon" class="modal-icon"></div>
                    <div id="modal-title" class="modal-title"></div>
                    <div id="modal-message" class="modal-message"></div>
                    <div class="modal-actions">
                        <button id="modal-cancel-btn" class="modal-btn modal-btn-secondary" style="display: none;">Cancelar</button>
                        <button id="modal-close-btn" class="modal-btn">OK</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    _createToastContainer: function() {
        if (document.getElementById('toast-container')) return;
        const container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    },

    show: function(type, title, message, isConfirm = false, onConfirm = null) {
        this._createModalHTML();
        const modal = document.getElementById('custom-modal');
        const iconContainer = document.getElementById('modal-icon');
        const titleEl = document.getElementById('modal-title');
        const messageEl = document.getElementById('modal-message');
        const closeBtn = document.getElementById('modal-close-btn');
        const cancelBtn = document.getElementById('modal-cancel-btn');

        titleEl.textContent = title;
        messageEl.textContent = message;
        
        iconContainer.className = 'modal-icon ' + (type === 'success' ? 'modal-success' : type === 'error' ? 'modal-error' : 'modal-warning');
        
        let iconHtml = '';
        if (type === 'success') iconHtml = '<i class="fas fa-check-circle"></i>';
        else if (type === 'error') iconHtml = '<i class="fas fa-exclamation-circle"></i>';
        else iconHtml = '<i class="fas fa-exclamation-triangle"></i>';
        
        iconContainer.innerHTML = iconHtml;

        // Reset buttons
        closeBtn.textContent = isConfirm ? 'Sim, Sair' : 'OK';
        cancelBtn.style.display = isConfirm ? 'flex' : 'none';

        // Remove previous listeners to avoid duplicates
        const newCloseBtn = closeBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

        newCloseBtn.addEventListener('click', () => {
            modal.classList.remove('show');
            if (onConfirm) onConfirm();
        });

        newCancelBtn.addEventListener('click', () => {
            modal.classList.remove('show');
        });

        modal.classList.add('show');
    },

    success: function(title, message) {
        this.show('success', title, message);
    },

    error: function(title, message) {
        this.show('error', title, message);
    },

    warning: function(title, message) {
        this.show('warning', title, message);
    },

    confirm: function(title, message, onConfirm) {
        this.show('warning', title, message, true, onConfirm);
    },

    toast: function(message, icon = 'info-circle') {
        this._createToastContainer();
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i class="fas fa-${icon}"></i> <span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            toast.style.transition = '0.4s';
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }
};

window.alert = function(msg) {
    Alerts.show('warning', 'Atenção', msg);
};
