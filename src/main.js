import "./style.css";
import * as vis from "vis-timeline/standalone";

// Load saved timeline data or use defaults
const items = new vis.DataSet(
  JSON.parse(localStorage.getItem("timelineData")) || [
  ]
);

var groups = [
  {
    id: 1,
    content: 'Default'
    // Optional: a field 'className', 'style', 'order', [properties]
  },
  {
    id: 2,
    content: 'Me',
    nestedGroups: [3]
  },
  {
    id: 3,
    content: "Work"
  }
];

// Initialize timeline
const container = document.getElementById("visualization");
const options = {};
const timeline = new vis.Timeline(container, items, groups, options);

// Tooltip element
const tooltip = document.getElementById("tooltip");

// Event Listeners
document.getElementById("add-event-btn").addEventListener("click", addEvent);
document.getElementById("save-json-btn").addEventListener("click", saveToFile);
document.getElementById("load-json-btn").addEventListener("click", loadFromFile);
document.addEventListener("click", (e) => {
  if (!e.target.closest("#visualization")) tooltip.style.display = "none";
});

// Auto-save to localStorage on updates
items.on("*", () => {
  localStorage.setItem("timelineData", JSON.stringify(items.get()));
});

/**
 * Adds a new event to the timeline
 */
function addEvent() {
  const content = document.getElementById("event-content").value;
  const start = document.getElementById("event-start").value;
  const end = document.getElementById("event-end").value;

  if (content && start) {
    items.add({ id: items.length + 1, content, start, end: end || null });
  }
}

/**
 * Saves timeline data to a JSON file
 */
function saveToFile() {
  const dataStr = JSON.stringify(items.get(), null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "timeline-data.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Loads timeline data from a JSON file
 */
function loadFromFile() {
  const input = document.getElementById("file-input");
  if (input.files.length === 0) return;

  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = (event) => {
    const data = JSON.parse(event.target.result);
    items.clear();
    items.add(data);
  };
  reader.readAsText(file);
}

/**
 * Displays a tooltip with overlapping event ages when an event is clicked
 */
timeline.on("select", (properties) => {
  if (properties.items.length === 0) {
    tooltip.style.display = "none";
    return;
  }

  const selectedId = properties.items[0];
  const selectedEvent = items.get(selectedId);
  const selectedDate = new Date(selectedEvent.start);

  tooltip.innerHTML = "";
  
  const results = items
    .get()
    .filter((event) => event.id !== selectedId)
    .map((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = event.end ? new Date(event.end) : new Date();

      // Check if the event overlaps with the selected event
      if (eventStart <= selectedDate && eventEnd >= selectedDate) {
        const age = selectedDate.getFullYear() - eventStart.getFullYear();
        return `${event.content} was ${age} years old at this time.`;
      }
      return null;
    })
    .filter(Boolean); // Remove null values

  if (results.length == 0) {
    tooltip.style.display = "none";
    return;
  }

  // Set tooltip content
  tooltip.innerHTML = results.join("<br>");
  
  // Position tooltip near the mouse click
  timeline.on("click", function (event) {
    if (event.event) {
      tooltip.style.left = `${event.event.clientX + 10}px`;
      tooltip.style.top = `${event.event.clientY + 10}px`;
      tooltip.style.display = "block";
    }
  });
});

// todo: issue with still diplaying this when selected has no overlap
// probably ref that on click above inside the on selected
timeline.on("click", (event) => {
  if (!event.item) tooltip.style.display = "none";
});

// todo: make a better editing ui
timeline.on("doubleClick", function (properties) {
  const eventId = properties.item;
  if (!eventId) return;

  const event = items.get(eventId);
  const newContent = prompt("Edit Event Name:", event.content);
  const newStart = prompt("Edit Start Date (YYYY-MM-DD):", event.start);
  const newEnd = prompt("Edit End Date (YYYY-MM-DD) or leave blank:", event.end || "");

  if (newContent && newStart) {
    items.update({
      id: eventId,
      content: newContent,
      start: newStart,
      end: newEnd || null,
    });
  }
});
