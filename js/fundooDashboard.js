$(document).ready(function () {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
        alert("No token found. Please log in first.");
        window.location.href = "fundooLogin.html";
        return;
    }

    let allNotes = [];
    let currentView = "notes";
    let selectedColor = "white";
    let isEditing = null;

    // Toggle sidebar
    $("#toggleSidebar").on("click", function () {
        const $container = $(".fundoo-dash-container");
        $container.toggleClass("sidebar-closed");
        adjustLayout();
    });

    // Fetch notes and display them
    function fetchNotes() {
        $("#notesGrid").append('<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>');
        fetch("http://localhost:3000/api/v1/notes", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        })
        .then(res => {
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return res.json();
        })
        .then(data => {
            allNotes = data.notes || [];
            displayNotes(currentView);
        })
        .catch(err => {
            console.error("Error fetching notes:", err);
            showError("An error occurred while fetching notes: " + err.message);
        })
        .finally(() => {
            $(".spinner-border").remove();
        });
    }

    // Expand the note form on focus
    $("#takeNoteInput").on("focus", function () {
        $("#createNoteCollapsed").hide();
        $("#expandedNote").css("display", "block");
        adjustLayout();
    });

    // Trigger note creation when Enter is pressed in expanded note
    $("#noteContent, #noteTitle").on("keypress", function (e) {
        if (e.which === 13 && !e.shiftKey) {
            e.preventDefault();
            $("#createNoteForm").trigger("submit");
        }
    });

    // Collapse the note form if clicked outside or closed
    $(document).on("click", function (e) {
        if (!$(e.target).closest(".fundoo-dash-create-note").length && $("#expandedNote").is(":visible")) {
            const title = $("#noteTitle").val().trim();
            const content = $("#noteContent").val().trim();
            if (!title && !content) {
                $("#expandedNote").hide();
                $("#createNoteCollapsed").show();
                $("#takeNoteInput").val("");
                $(".color-palette").hide();
                selectedColor = "white";
                adjustLayout();
            }
        }
        if (!$(e.target).closest(".color-btn, .color-btn-note, .color-palette, .color-palette-note, .modal").length) {
            $(".color-palette, .color-palette-note").hide();
            if (isEditing) {
                $("#editNoteModal").modal("hide");
                isEditing = null;
            }
        }
    });

    // Close button functionality
    $(".close-btn").on("click", function () {
        const title = $("#noteTitle").val().trim();
        const content = $("#noteContent").val().trim();
        if (!title && !content) {
            $("#expandedNote").hide();
            $("#createNoteCollapsed").show();
            $("#takeNoteInput").val("");
            $(".color-palette").hide();
            selectedColor = "white";
            adjustLayout();
        }
    });

    // Color button functionality for create note
    $(document).on("click", ".color-btn", function (e) {
        e.preventDefault();
        e.stopPropagation();
        console.log("Color button (create) clicked...");
        const $button = $(this);
        let $palette = $("#expandedNote .color-palette");

        if ($palette.length && $palette.is(":hidden")) {
            $palette.css({
                top: $button.position().top + $button.outerHeight() + 5,
                left: $button.position().left,
                position: "absolute"
            }).show();
            console.log("Palette shown at:", $palette.position());
        } else if ($palette.length) {
            $palette.hide();
        } else {
            console.warn("Color palette not found in DOM");
        }

        $palette.find(".color-option").off("click").on("click", function () {
            selectedColor = $(this).data("color");
            $(".note-card.new-note").removeClass("white red orange yellow green teal blue dark-blue purple pink brown gray").addClass(selectedColor);
            $palette.hide();
            console.log("Color selected:", selectedColor);
        });
    });

    // Color button functionality for edit modal
    $(document).on("click", ".color-btn-modal", function (e) {
        e.preventDefault();
        e.stopPropagation();
        console.log("Color button (modal) clicked...");
        const $button = $(this);
        let $palette = $("#editNoteModal .color-palette-note");

        if ($palette.length && $palette.is(":hidden")) {
            $palette.css({
                top: $button.position().top + $button.outerHeight() + 5,
                left: $button.position().left,
                position: "absolute"
            }).show();
            console.log("Modal palette shown at:", $palette.position());
        } else if ($palette.length) {
            $palette.hide();
        } else {
            console.warn("Modal color palette not found in DOM");
        }

        $palette.find(".color-option").off("click").on("click", function () {
            const newColor = $(this).data("color");
            $(`#editNoteModal .note-card[data-note-id="${isEditing}"]`).removeClass("white red orange yellow green teal blue dark-blue purple pink brown gray").addClass(newColor);
            $palette.hide();
            console.log("Modal color selected:", newColor);

            fetch(`http://localhost:3000/api/v1/notes/${isEditing}/change_color`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ color: newColor }),
            })
            .then(res => {
                if (!res.ok) throw new Error("Failed to update note color.");
                return res.json();
            })
            .catch(err => {
                console.error("Error updating note color:", err);
                showError("An error occurred while updating the note color: " + err.message);
            });
        });
    });

    // Create a new note
    $("#createNoteForm").on("submit", function (event) {
        event.preventDefault();
        console.log("Form submission triggered");
        const title = $("#noteTitle").val().trim();
        const content = $("#noteContent").val().trim();
        console.log("Form data:", { title, content, color: selectedColor });

        if (!title && !content) {
            showError("Please enter a title or content.");
            return;
        }

        $("#notesGrid").append('<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Creating note...</span></div>');
        fetch("http://localhost:3000/api/v1/notes/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ title, content, color: selectedColor }),
        })
        .then(res => {
            console.log("API response status:", res.status);
            if (!res.ok) throw new Error(`Failed to create note. Status: ${res.status} - ${res.statusText}`);
            return res.json();
        })
        .then(data => {
            console.log("Note creation response:", data);
            if (data.note) {
                allNotes.push(data.note);
                displayNotes(currentView);
            } else {
                showError("Note creation succeeded but response format unexpected.");
            }
            $("#expandedNote").hide();
            $("#createNoteCollapsed").show();
            $("#takeNoteInput").val("");
            $("#noteTitle").val("");
            $("#noteContent").val("");
            selectedColor = "white";
        })
        .catch(err => {
            console.error("Error creating note:", err);
            showError(`Error creating note: ${err.message}`);
        })
        .finally(() => {
            $(".spinner-border").remove();
        });
    });

    function displayNotes(view) {
        currentView = view;
        $(".notes-container, .archive-container, .trash-container").hide();
        $(".fundoo-dash-create-note").hide();

        if (view === "notes") {
            $(".notes-container").show();
            $(".fundoo-dash-create-note").show();
        } else if (view === "archive") {
            $(".archive-container").show();
        } else if (view === "trash") {
            $(".trash-container").show();
        }

        const filteredNotes = view === "archive"
            ? allNotes.filter(note => note.archived && !note.deleted)
            : view === "trash"
            ? allNotes.filter(note => note.deleted)
            : allNotes.filter(note => !note.archived && !note.deleted);

        $(`.${view}-list`).empty();
        console.log(`Displaying ${filteredNotes.length} notes in ${view} view`);

        filteredNotes.forEach((note) => {
            addNoteToDOM(note, view);
        });
        adjustLayout();
    }

    function sanitizeContent(content) {
        return content.replace(/[^a-zA-Z0-9\s.,!?]/g, '').trim() || 'No content available';
    }

    function addNoteToDOM(note, view) {
        const noteTitle = note.title || "Untitled";
        const noteContent = sanitizeContent(note.content);
        const noteDate = note.created_at ? new Date(note.created_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric", hour12: true }) : "Unknown Date";
        const noteColor = note.color || "white";

        const noteHTML = `
            <div class="note-card ${noteColor}" data-note-id="${note.id}" data-was-archived="${note.archived || false}">
                <div class="note-title">${noteTitle}</div>
                <div class="note-content">${noteContent}</div>
                <div class="note-footer">${noteDate}</div>
                <div class="note-actions">
                    <button class="color-btn-note"><i class="fas fa-palette"></i></button>
                    ${view === "archive" ? '<button class="unarchive-btn"><i class="fas fa-box-open"></i></button>' : ""}
                    ${view === "notes" ? '<button class="archive-btn"><i class="fas fa-archive"></i></button>' : ""}
                    ${view === "trash" ? '<button class="restore-btn"><i class="fas fa-trash-restore"></i></button><button class="delete-permanent-btn"><i class="fas fa-trash"></i></button>' : '<button class="delete-btn"><i class="fas fa-trash"></i></button>'}
                </div>
                <div class="color-palette-note"></div>
            </div>`;

        $(`.${view}-list`).append(noteHTML);
        console.log(`Added note ${note.id} to ${view} view`);

        const $noteCard = $(`.note-card[data-note-id="${note.id}"]`);
        let $colorPaletteNote = $noteCard.find(".color-palette-note");

        if ($colorPaletteNote.length === 0) {
            const paletteHTML = `
                <div class="color-palette-note">
                    <div class="color-option white" data-color="white" style="background-color: #ffffff; width: 20px; height: 20px;"></div>
                    <div class="color-option red" data-color="red" style="background-color: #f28b82; width: 20px; height: 20px;"></div>
                    <div class="color-option orange" data-color="orange" style="background-color: #fbbc04; width: 20px; height: 20px;"></div>
                    <div class="color-option yellow" data-color="yellow" style="background-color: #fff475; width: 20px; height: 20px;"></div>
                    <div class="color-option green" data-color="green" style="background-color: #ccff90; width: 20px; height: 20px;"></div>
                    <div class="color-option teal" data-color="teal" style="background-color: #a7ffeb; width: 20px; height: 20px;"></div>
                    <div class="color-option blue" data-color="blue" style="background-color: #cbf0f8; width: 20px; height: 20px;"></div>
                    <div class="color-option dark-blue" data-color="dark-blue" style="background-color: #aecbfa; width: 20px; height: 20px;"></div>
                    <div class="color-option purple" data-color="purple" style="background-color: #d7aefb; width: 20px; height: 20px;"></div>
                    <div class="color-option pink" data-color="pink" style="background-color: #fdcfe8; width: 20px; height: 20px;"></div>
                    <div class="color-option brown" data-color="brown" style="background-color: #e6c9a8; width: 20px; height: 20px;"></div>
                    <div class="color-option gray" data-color="gray" style="background-color: #e8eaed; width: 20px; height: 20px;"></div>
                </div>
            `;
            $noteCard.find(".color-btn-note").after(paletteHTML);
            $colorPaletteNote = $noteCard.find(".color-palette-note");
            $colorPaletteNote.find(".color-option").on("click", function () {
                const newColor = $(this).data("color");
                $noteCard.removeClass("white red orange yellow green teal blue dark-blue purple pink brown gray").addClass(newColor);
                $colorPaletteNote.hide();
                fetch(`http://localhost:3000/api/v1/notes/${note.id}/change_color`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ color: newColor }),
                })
                .then(res => {
                    if (!res.ok) throw new Error("Failed to update note color.");
                    return res.json();
                })
                .catch(err => {
                    console.error("Error updating note color:", err);
                    showError("An error occurred while updating the note color: " + err.message);
                });
            });
        }

        $noteCard.find(".color-btn-note").on("click", function (e) {
            e.preventDefault();
            if ($(e.target).closest(".note-actions").length && (view === "archive" || view === "trash")) {
                return;
            }
            $colorPaletteNote.toggle();
            if ($colorPaletteNote.is(":visible")) {
                const buttonPosition = $(this).position();
                $colorPaletteNote.css({
                    top: buttonPosition.top + $(this).outerHeight() + 5,
                    left: buttonPosition.left - 100,
                    position: "absolute"
                }).show();
            }
        });

        $noteCard.on("click", function (e) {
            if ($(e.target).closest(".note-actions").length || $(e.target).closest(".color-palette-note").length) {
                return;
            }
            if (!isEditing) {
                isEditing = note.id;
                $("#editNoteModalLabel").text(`Edit note #${note.id}`);
                $("#editNoteTitle").val(note.title || "");
                $("#editNoteContent").val(note.content || "");
                $("#editNoteModal").modal("show");
            }
        });
    }

    // Move Note to Trash
    $(document).on("click", ".delete-btn", function () {
        const noteCard = $(this).closest(".note-card");
        const noteId = noteCard.data("note-id");
        const wasArchived = noteCard.data("was-archived") === "true";

        fetch(`http://localhost:3000/api/v1/notes/${noteId}/trash`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        })
        .then(res => {
            if (!res.ok) throw new Error(`Failed to trash note. Status: ${res.status}`);
            allNotes = allNotes.map(note => note.id === noteId ? { ...note, deleted: true, archived: wasArchived } : note);
            displayNotes(currentView);
        })
        .catch(err => {
            console.error("Error moving note to trash:", err);
            showError("An error occurred while moving the note to trash: " + err.message);
        });
    });

    // Restore from Trash
    $(document).on("click", ".restore-btn", function () {
        const noteCard = $(this).closest(".note-card");
        const noteId = noteCard.data("note-id");
        const wasArchived = noteCard.data("was-archived") === "true";

        fetch(`http://localhost:3000/api/v1/notes/${noteId}/restore`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        })
        .then(res => {
            if (!res.ok) throw new Error(`Failed to restore note. Status: ${res.status}`);
            return res.json();
        })
        .then(data => {
            const updatedNote = data.note;
            allNotes = allNotes.map(note => note.id === noteId ? updatedNote : note);
            console.log("Restored note state:", updatedNote);
            displayNotes(wasArchived ? "archive" : "notes");
        })
        .catch(err => {
            console.error("Error restoring note:", err);
            showError("An error occurred while restoring the note: " + err.message);
        });
    });

    // Permanently Delete Note
    $(document).on("click", ".delete-permanent-btn", function () {
        const noteId = $(this).closest(".note-card").data("note-id");

        fetch(`http://localhost:3000/api/v1/notes/${noteId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        .then(res => {
            if (!res.ok) throw new Error(`Failed to delete note. Status: ${res.status}`);
            allNotes = allNotes.filter(note => note.id !== noteId);
            displayNotes(currentView);
        })
        .catch(err => {
            console.error("Error deleting note permanently:", err);
            showError("An error occurred while deleting the note permanently: " + err.message);
        });
    });

    // Archive & Unarchive
    $(document).on("click", ".archive-btn, .unarchive-btn", function () {
        const noteId = $(this).closest(".note-card").data("note-id");
        const isUnarchive = $(this).hasClass("unarchive-btn");

        fetch(`http://localhost:3000/api/v1/notes/${noteId}/archive`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        })
        .then(res => {
            if (!res.ok) throw new Error(`Failed to toggle archive. Status: ${res.status}`);
            allNotes = allNotes.map(note => note.id === noteId ? { ...note, archived: !isUnarchive } : note);
            displayNotes(currentView);
        })
        .catch(err => {
            console.error("Error toggling archive status:", err);
            showError("An error occurred while archiving/unarchiving the note: " + err.message);
        });
    });

    // Tab Switching
    $("#notesTab").on("click", function () {
        $(".fundoo-dash-sidebar nav ul li").removeClass("active");
        $(this).addClass("active");
        displayNotes("notes");
    });

    $("#archiveTab").on("click", function () {
        $(".fundoo-dash-sidebar nav ul li").removeClass("active");
        $(this).addClass("active");
        displayNotes("archive");
    });

    $("#trashTab").on("click", function () {
        $(".fundoo-dash-sidebar nav ul li").removeClass("active");
        $(this).addClass("active");
        displayNotes("trash");
    });

    // Search Functionality
    $("#searchInput").on("input", function () {
        const searchQuery = $(this).val().trim().toLowerCase();
        displaySearchedNotes(searchQuery);
    });

    function displaySearchedNotes(query) {
        if (!query) {
            displayNotes(currentView);
            return;
        }

        const filteredNotes = allNotes.filter(note => 
            (note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query)) && 
            ((currentView === "notes" && !note.archived && !note.deleted) ||
             (currentView === "archive" && note.archived && !note.deleted) ||
             (currentView === "trash" && note.deleted))
        );

        $(`.${currentView}-list`).empty();
        filteredNotes.forEach(note => addNoteToDOM(note, currentView));
    }

    // Logout
    $("#logoutBtn").on("click", function () {
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("userEmail");
        window.location.href = "fundooLogin.html";
    });

    // Set User Avatar and Profile Info
    function setUserAvatar() {
        let userEmail = localStorage.getItem("userEmail");
        let userName = "Default User";
        if (!userEmail) {
            const parseToken = (token) => {
                try {
                    const base64Url = token.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
                    return JSON.parse(jsonPayload);
                } catch (error) {
                    console.error("Error parsing token:", error);
                    return null;
                }
            };
            const tokenData = parseToken(token);
            userEmail = tokenData?.email || "user@example.com";
            userName = tokenData?.name || userName;
            if (tokenData?.email) localStorage.setItem("userEmail", userEmail);
            if (tokenData?.name) localStorage.setItem("userName", userName);
            else console.warn("No name or email found in token, using defaults:", { userEmail, userName });
        } else {
            userName = localStorage.getItem("userName") || userName;
        }
        const firstLetter = userEmail.charAt(0).toUpperCase();
        $(".user-avatar").text(firstLetter);
        $(".user-info .name").text(userName);
        $(".user-info .email").text(userEmail);
    }

    // Save changes from modal
    $("#saveNoteChanges").on("click", function () {
        if (isEditing) {
            const newTitle = $("#editNoteTitle").val().trim();
            const newContent = $("#editNoteContent").val().trim();
            if (newTitle || newContent) {
                fetch(`http://localhost:3000/api/v1/notes/${isEditing}/update`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ title: newTitle, content: newContent }),
                })
                .then(res => {
                    if (!res.ok) throw new Error(`Failed to update note. Status: ${res.status}`);
                    return res.json();
                })
                .then(data => {
                    const note = allNotes.find(n => n.id === isEditing);
                    if (note) {
                        note.title = newTitle || note.title;
                        note.content = newContent || note.content;
                    }
                    $("#editNoteModal").modal("hide");
                    isEditing = null;
                    displayNotes(currentView);
                })
                .catch(err => {
                    console.error("Error updating note:", err);
                    showError(`Error updating note: ${err.message}`);
                });
            } else {
                showError("Please enter a title or content.");
            }
        }
    });

    // Cancel edit from modal (mapped to Close button)
    $(".btn-close-note").on("click", function () {
        $("#editNoteModal").modal("hide");
        isEditing = null;
    });

    // Show error as toast notification
    function showError(message) {
        const toastHTML = `
            <div class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <strong class="me-auto">Error</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">${message}</div>
            </div>
        `;
        $("#toastContainer").append(toastHTML).toast({ delay: 3000 }).toast("show");
    }

    // Adjust layout dynamically
    function adjustLayout() {
        const sidebarWidth = $(".fundoo-dash-container").hasClass("sidebar-closed") ? 56 : 240;
        $(".fundoo-dash-create-note").css({
            marginLeft: sidebarWidth + "px",
            width: `calc(100% - ${sidebarWidth}px)`
        });
        $(".fundoo-dash-notes-grid").css({
            marginLeft: sidebarWidth + "px",
            width: `calc(100% - ${sidebarWidth}px)`
        });
        console.log(`Adjusted layout: Sidebar width = ${sidebarWidth}px`);
    }

    // Initialize the page
    fetchNotes();
    setUserAvatar();
    adjustLayout();
    $(window).resize(adjustLayout);
});