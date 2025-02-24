$(document).ready(function () {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
        alert("No token found. Please log in first.");
        window.location.href = "fundooLogin.html";
        return;
    }

    let allNotes = []; // Store all notes
    let currentView = "notes"; // Default view: "notes", "archive", or "trash"

    // Fetch notes and display them
    function fetchNotes() {
        fetch("http://localhost:3000/api/v1/notes", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        })
        .then(res => res.json())
        .then(data => {
            allNotes = data.notes;
            displayNotes(currentView); // Ensure display is based on current view
        })
        .catch(err => {
            console.error("Error fetching notes:", err);
            alert("An error occurred while fetching notes.");
        });
    }

    fetchNotes(); // Initial fetch
     // 3. Create a new note
  $("#createNoteForm").on("submit", function (event) {
    event.preventDefault();
    const title = $("#noteTitle").val().trim();
    const content = $("#noteContent").val().trim();

    if (!title) {
        alert("Please enter a note title.");
        return;
    }

    fetch("http://localhost:3000/api/v1/notes/create", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content }),
    })
    .then((res) => {
        if (!res.ok) throw new Error("Failed to create note.");
        return res.json();
    })	
    .then((responseData) => {
        console.log("Created note:", responseData);
        addNoteToDOM(responseData.note || responseData);
        $("#noteTitle").val("");
        $("#noteContent").val("");
    })
    .catch((err) => {
        console.error(err);
        alert("Error creating note.");
    });
});



    // Display Notes based on the current view
    function displayNotes(view) {
        currentView = view;
        $("#notesContainer .notes-list").empty();
        $("#archiveContainer .archive-list").empty();
        $("#trashContainer .trash-list").empty();

        $("#notesContainer, #archiveContainer, #trashContainer").hide();
        if (view === "archive") $("#archiveContainer").show();
        else if (view === "trash") $("#trashContainer").show();
        else $("#notesContainer").show();

        const filteredNotes = view === "archive"
            ? allNotes.filter(note => note.archived && !note.deleted)
            : view === "trash"
            ? allNotes.filter(note => note.deleted)
            : allNotes.filter(note => !note.archived && !note.deleted);

        filteredNotes.forEach((note) => {
            addNoteToDOM(note, view);
        });
    }

    function addNoteToDOM(note, view) {
        const noteTitle = note.title || "Untitled";
        const noteContent = note.content || "No content available";
        const noteDate = note.created_at ? new Date(note.created_at).toLocaleString() : "Unknown Date";
    
        const noteHTML = `
            <div class="note-card" data-note-id="${note.id}" data-was-archived="${note.archived}">
                <div class="note-title"><strong>${noteTitle}</strong></div>
                <div class="note-content">${noteContent}</div>
                <div class="note-footer">${noteDate}</div>
                <div class="note-actions">
                    ${view === "archive" ? `<button class="unarchive-btn"><i class="fas fa-box-open"></i></button>` : ""}
                    ${view === "notes" ? `<button class="archive-btn"><i class="fas fa-archive"></i></button>` : ""}
                    ${view === "trash" ? `
                        <button class="restore-btn"><i class="fas fa-trash-restore"></i></button>
                        <button class="delete-permanent-btn"><i class="fas fa-trash"></i></button>
                    ` : `<button class="delete-btn"><i class="fas fa-trash"></i></button>`}
                </div>
            </div>
        `;
    
        if (view === "archive") {
            $("#archiveContainer .archive-list").append(noteHTML);
        } else if (view === "trash") {
            $("#trashContainer .trash-list").append(noteHTML);
        } else {
            $("#notesContainer .notes-list").append(noteHTML);
        }
    }
    
    // Move Note to Trash (instead of permanent delete)
    $(document).on("click", ".delete-btn", function () {
        const noteCard = $(this).closest(".note-card");
        const noteId = noteCard.data("note-id");
        const wasArchived = noteCard.data("was-archived"); // Capture if note was archived before deleting
        
        fetch(`http://localhost:3000/api/v1/notes/${noteId}/trash`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        })
        .then(() => {
            allNotes = allNotes.map(note =>
                note.id === noteId ? { ...note, deleted: true, archived: wasArchived } : note
            );
            displayNotes(currentView); // Stay on the current view after action
        })
        .catch(err => {
            console.error("Error moving note to trash:", err);
            alert("An error occurred while moving the note to trash.");
        });
    });

    // Restore from Trash (Restore to Archive if originally archived)
    $(document).on("click", ".restore-btn", function () {
        const noteCard = $(this).closest(".note-card");
        const noteId = noteCard.data("note-id");
        const wasArchived = noteCard.data("was-archived"); // Retrieve original archive status
        
        fetch(`http://localhost:3000/api/v1/notes/${noteId}/restore`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        })
        .then(() => {
            allNotes = allNotes.map(note =>
                note.id === noteId ? { ...note, deleted: false, archived: wasArchived } : note
            );

            displayNotes(currentView); // Stay on the current view after restoring
        })
        .catch(err => {
            console.error("Error restoring note:", err);
            alert("An error occurred while restoring the note.");
        });
    });

    // Permanently Delete Note from Trash
    $(document).on("click", ".delete-permanent-btn", function () {
        const noteId = $(this).closest(".note-card").data("note-id");
        
        fetch(`http://localhost:3000/api/v1/notes/${noteId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        .then(() => {
            allNotes = allNotes.filter(note => note.id !== noteId);
            displayNotes(currentView); // Stay on the current view after permanent deletion
        })
        .catch(err => {
            console.error("Error deleting note permanently:", err);
            alert("An error occurred while deleting the note permanently.");
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
        .then(() => {
            allNotes = allNotes.map(note =>
                note.id === noteId ? { ...note, archived: !isUnarchive } : note
            );

            displayNotes(currentView); // Stay on the current view after action
        })
        .catch(err => {
            console.error("Error toggling archive status:", err);
            alert("An error occurred while archiving/unarchiving the note.");
        });
    });

    // Tab Switching: Notes, Archive, Trash
    $("#notesTab").on("click", function () {
        currentView = "notes"; // Set the view to "notes"
        displayNotes("notes");
    });

    $("#archiveTab").on("click", function () {
        currentView = "archive"; // Set the view to "archive"
        displayNotes("archive");
    });

    $("#trashTab").on("click", function () {
        currentView = "trash"; // Set the view to "trash"
        displayNotes("trash");
    });

    // Logout
    $("#logoutBtn").on("click", function () {
        localStorage.removeItem("jwtToken");
        window.location.href = "fundooLogin.html";
    });
});
