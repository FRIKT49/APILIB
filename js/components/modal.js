/**
 * API Library - modal.js
 * Modal Dialog Management & Confirmation Dialogs
 */

export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.add("open");
  document.body.style.overflow = "hidden";

  // Auto focus first input if available
  const firstInput = modal.querySelector("input, textarea, select");
  if (firstInput) firstInput.focus();
}

export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove("open");
  document.body.style.overflow = "";
}

/**
 * Initialize event listeners for modal close buttons and backdrop clicks
 */
export function initModals() {
  document.addEventListener("click", (e) => {
    // Click on close button
    if (e.target.matches(".modal-close, [data-close-modal]")) {
      const modal = e.target.closest(".modal-backdrop");
      if (modal) closeModal(modal.id);
    }
    // Click on backdrop directly
    if (e.target.classList.contains("modal-backdrop")) {
      closeModal(e.target.id);
    }
  });

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const openModalElem = document.querySelector(".modal-backdrop.open");
      if (openModalElem) closeModal(openModalElem.id);
    }
  });
}

/**
 * Programmatic confirmation dialog returning a Promise
 */
export function showConfirmDialog({
  title = "Подтверждение",
  message = "Вы уверены, что хотите выполнить это действие?",
  confirmText = "Подтвердить",
  cancelText = "Отмена",
  isDanger = false
}) {
  return new Promise((resolve) => {
    let confirmModal = document.getElementById("genericConfirmModal");
    if (!confirmModal) {
      confirmModal = document.createElement("div");
      confirmModal.id = "genericConfirmModal";
      confirmModal.className = "modal-backdrop";
      confirmModal.innerHTML = `
        <div class="modal-dialog">
          <div class="modal-header">
            <h3 class="modal-title" id="genericConfirmTitle"></h3>
            <button class="modal-close" data-close-modal>&times;</button>
          </div>
          <div class="modal-body">
            <p id="genericConfirmMessage" style="color: var(--text-secondary);"></p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="genericConfirmCancel"></button>
            <button class="btn" id="genericConfirmOk"></button>
          </div>
        </div>
      `;
      document.body.appendChild(confirmModal);
    }

    document.getElementById("genericConfirmTitle").textContent = title;
    document.getElementById("genericConfirmMessage").textContent = message;

    const cancelBtn = document.getElementById("genericConfirmCancel");
    const okBtn = document.getElementById("genericConfirmOk");

    cancelBtn.textContent = cancelText;
    okBtn.textContent = confirmText;
    okBtn.className = isDanger ? "btn btn-danger" : "btn btn-primary";

    const handleCancel = () => {
      cleanup();
      closeModal("genericConfirmModal");
      resolve(false);
    };

    const handleOk = () => {
      cleanup();
      closeModal("genericConfirmModal");
      resolve(true);
    };

    const cleanup = () => {
      cancelBtn.removeEventListener("click", handleCancel);
      okBtn.removeEventListener("click", handleOk);
    };

    cancelBtn.addEventListener("click", handleCancel);
    okBtn.addEventListener("click", handleOk);

    openModal("genericConfirmModal");
  });
}
