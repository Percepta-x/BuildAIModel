// script.js
// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const generateBtn = document.getElementById('generateBtn');
const clearBtn = document.getElementById('clearBtn');
const downloadBtn = document.getElementById('downloadBtn');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const targetSelection = document.getElementById('targetSelection');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const treePlaceholder = document.getElementById('treePlaceholder');
const treeDiagram = document.getElementById('tree-diagram');
const targetSelect = document.getElementById('targetSelect');

// Event Listeners
browseBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);
generateBtn.addEventListener('click', generateDecisionTree);
clearBtn.addEventListener('click', clearAll);
downloadBtn.addEventListener('click', downloadResults);

// Drag and drop events
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, unhighlight, false);
});

function highlight() {
    dropZone.classList.add('drag-over');
}

function unhighlight() {
    dropZone.classList.remove('drag-over');
}

dropZone.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

function handleFileSelect() {
    const files = fileInput.files;
    handleFiles(files);
}

function handleFiles(files) {
    if (files.length === 0) return;
    
    const file = files[0];
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 
                       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
                       'application/json'];
    
    if (!validTypes.includes(file.type)) {
        alert('Please upload a CSV, Excel, or JSON file.');
        return;
    }
    
    // Update file info
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileInfo.classList.add('active');
    targetSelection.classList.add('active');
    generateBtn.disabled = false;
    
    // Simulate upload progress
    simulateUploadProgress();
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function simulateUploadProgress() {
    progressContainer.style.display = 'block';
    let width = 0;
    const interval = setInterval(() => {
        if (width >= 100) {
            clearInterval(interval);
        } else {
            width += Math.random() * 10;
            if (width > 100) width = 100;
            progressBar.style.width = width + '%';
        }
    }, 200);
}

function generateDecisionTree() {
    // Show processing state
    generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    generateBtn.disabled = true;
    
    // Get selected target
    const target = targetSelect.value;
    
    // Simulate processing delay
    setTimeout(() => {
        // Hide placeholder and show diagram
        treePlaceholder.style.display = 'none';
        treeDiagram.style.display = 'block';
        
        // Render the decision tree visualization
        renderDecisionTree(target);
        
        // Initialize charts
        initCharts();
        
        // Update button states
        generateBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Regenerate Tree';
        generateBtn.disabled = false;
        downloadBtn.disabled = false;
        
        // Show success message
        showNotification(`Decision tree generated successfully for target: ${target.replace('_', ' ')}`);
    }, 2500);
}

function renderDecisionTree(target) {
    // Clear previous diagram
    treeDiagram.innerHTML = '';
    
    // Set dimensions
    const width = treeDiagram.clientWidth;
    const height = treeDiagram.clientHeight;
    const margin = { top: 40, right: 120, bottom: 40, left: 40 };
    
    // Create SVG container
    const svg = d3.select(treeDiagram)
        .attr('width', width)
        .attr('height', height);
    
    // Create a group for the tree
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Create a sample tree structure based on target
    let treeData;
    
    if (target === 'loan_approval') {
        treeData = {
            name: "Income > $50k?",
            children: [
                {
                    name: "Credit Score > 700?",
                    children: [
                        { name: "APPROVE", value: 234 },
                        { name: "Age > 35?", 
                          children: [
                            { name: "APPROVE", value: 189 },
                            { name: "REVIEW", value: 45 }
                          ] 
                        }
                    ]
                },
                {
                    name: "Employment > 2 years?",
                    children: [
                        { name: "APPROVE", value: 167 },
                        { name: "REJECT", value: 98 }
                    ]
                }
            ]
        };
    } else if (target === 'income_level') {
        treeData = {
            name: "Education Level?",
            children: [
                {
                    name: "Graduate Degree?",
                    children: [
                        { name: "High Income", value: 187 },
                        { name: "Experience > 5y?", 
                          children: [
                            { name: "High Income", value: 142 },
                            { name: "Medium Income", value: 45 }
                          ] 
                        }
                    ]
                },
                {
                    name: "Undergraduate Degree?",
                    children: [
                        { name: "Experience > 5y?", 
                          children: [
                            { name: "Medium Income", value: 156 },
                            { name: "Low Income", value: 67 }
                          ] 
                        },
                        { name: "Medium Income", value: 124 }
                    ]
                }
            ]
        };
    } else { // credit_rating
        treeData = {
            name: "Payment History?",
            children: [
                {
                    name: "On Time Payments?",
                    children: [
                        { name: "Excellent", value: 210 },
                        { name: "Credit Utilization?", 
                          children: [
                            { name: "Good", value: 125 },
                            { name: "Fair", value: 85 }
                          ] 
                        }
                    ]
                },
                {
                    name: "Missed Payments?",
                    children: [
                        { name: "Credit Utilization?", 
                          children: [
                            { name: "Fair", value: 95 },
                            { name: "Poor", value: 65 }
                          ] 
                        },
                        { name: "Poor", value: 110 }
                    ]
                }
            ]
        };
    }
    
    // Set up tree layout
    const treeLayout = d3.tree()
        .size([height - margin.top - margin.bottom, width - margin.left - margin.right]);
    
    // Convert data to hierarchy
    const root = d3.hierarchy(treeData);
    treeLayout(root);
    
    // Create links
    const link = g.selectAll('.link')
        .data(root.links())
        .enter().append('path')
        .attr('class', 'link')
        .attr('d', d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x))
        .attr('fill', 'none')
        .attr('stroke', 'rgba(108, 92, 231, 0.6)')
        .attr('stroke-width', 2);
    
    // Create nodes
    const node = g.selectAll('.node')
        .data(root.descendants())
        .enter().append('g')
        .attr('class', d => `node ${d.children ? 'node--internal' : 'node--leaf'}`)
        .attr('transform', d => `translate(${d.y},${d.x})`);
    
    // Add circles
    node.append('circle')
        .attr('r', 8)
        .attr('fill', d => d.children ? '#6c5ce7' : '#00cec9')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);
    
    // Add text labels
    node.append('text')
        .attr('dy', d => d.children ? -15 : 15)
        .attr('dx', d => d.children ? -5 : 5)
        .attr('text-anchor', d => d.children ? 'end' : 'start')
        .attr('fill', '#fff')
        .attr('font-size', '14px')
        .text(d => d.data.name);
    
    // Add value for leaf nodes
    node.filter(d => !d.children)
        .append('text')
        .attr('dy', 15)
        .attr('dx', 5)
        .attr('text-anchor', 'start')
        .attr('fill', 'rgba(255, 255, 255, 0.7)')
        .attr('font-size', '12px')
        .text(d => `Cases: ${d.data.value}`);
}

function initCharts() {
    // Accuracy chart
    const accuracyCtx = document.getElementById('accuracyChart').getContext('2d');
    new Chart(accuracyCtx, {
        type: 'bar',
        data: {
            labels: ['Training', 'Validation'],
            datasets: [{
                label: 'Accuracy (%)',
                data: [92.4, 89.7],
                backgroundColor: [
                    'rgba(108, 92, 231, 0.7)',
                    'rgba(0, 206, 201, 0.7)'
                ],
                borderColor: [
                    'rgba(108, 92, 231, 1)',
                    'rgba(0, 206, 201, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    },
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function clearAll() {
    // Reset file input
    fileInput.value = '';
    
    // Reset UI elements
    fileInfo.classList.remove('active');
    targetSelection.classList.remove('active');
    generateBtn.disabled = true;
    downloadBtn.disabled = true;
    generateBtn.innerHTML = '<i class="fas fa-cogs"></i> Generate Decision Tree';
    progressContainer.style.display = 'none';
    progressBar.style.width = '0%';
    
    // Show placeholder and hide diagram
    treePlaceholder.style.display = 'block';
    treeDiagram.style.display = 'none';
    
    // Show notification
    showNotification('All inputs cleared. Ready for new dataset.');
}

function downloadResults() {
    showNotification('Preparing your results for download...');
    
    setTimeout(() => {
        showNotification('Results downloaded successfully!');
    }, 1500);
}

function showNotification(message) {
    // Remove existing notification if present
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div style="position: fixed; bottom: 30px; right: 30px; background: var(--primary); color: white; padding: 15px 25px; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); z-index: 1000; display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Initialize charts on load for demo
window.addEventListener('load', () => {
    initCharts();
});