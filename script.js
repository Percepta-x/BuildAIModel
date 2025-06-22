document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    const processBtn = document.getElementById('process-btn');
    const changeFileBtn = document.getElementById('change-file-btn');
    const resultsContainer = document.getElementById('results-container');
    const loading = document.getElementById('loading');
    const regenerateBtn = document.getElementById('regenerate-btn');
    
    // Event listeners
    browseBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    changeFileBtn.addEventListener('click', () => fileInput.click());
    processBtn.addEventListener('click', processFile);
    regenerateBtn.addEventListener('click', processFile);
    
    // Drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.add('drag-over');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.remove('drag-over');
        }, false);
    });
    
    uploadArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        fileInput.files = files;
        handleFileSelect();
    }
    
    function handleFileSelect() {
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            fileName.textContent = file.name;
            fileSize.textContent = formatFileSize(file.size);
            fileInfo.style.display = 'flex';
            
            // Update icon based on file type
            const fileIcon = fileInfo.querySelector('.file-icon');
            const ext = file.name.split('.').pop().toLowerCase();
            
            if (ext === 'csv') {
                fileIcon.className = 'fas fa-file-csv file-icon';
            } else if (ext === 'json') {
                fileIcon.className = 'fas fa-file-code file-icon';
            } else if (ext === 'xls' || ext === 'xlsx') {
                fileIcon.className = 'fas fa-file-excel file-icon';
            } else {
                fileIcon.className = 'fas fa-file file-icon';
            }
        }
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    function processFile() {
        if (!fileInput.files.length) return;
        
        // Show loading state
        loading.style.display = 'block';
        resultsContainer.style.display = 'none';
        processBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        processBtn.disabled = true;
        
        // Simulate processing delay
        setTimeout(() => {
            // Hide loading
            loading.style.display = 'none';
            
            // Generate sample data for visualization
            generateSampleData();
            
            // Show results
            resultsContainer.style.display = 'block';
            
            // Reset button
            processBtn.innerHTML = '<i class="fas fa-cogs"></i> Generate Decision Tree';
            processBtn.disabled = false;
            
            // Scroll to results
            resultsContainer.scrollIntoView({ behavior: 'smooth' });
        }, 2500);
    }
    
    function generateSampleData() {
        // Update stats
        document.getElementById('stat-rows').textContent = '1,204';
        document.getElementById('stat-cols').textContent = '12';
        document.getElementById('stat-nodes').textContent = '27';
        document.getElementById('stat-accuracy').textContent = '92.3%';
        
        // Populate features table
        const features = [
            { name: 'Annual Income', importance: 'High', type: 'Numerical' },
            { name: 'Credit Score', importance: 'High', type: 'Numerical' },
            { name: 'Loan Amount', importance: 'High', type: 'Numerical' },
            { name: 'Employment Status', importance: 'Medium', type: 'Categorical' },
            { name: 'Debt-to-Income Ratio', importance: 'Medium', type: 'Numerical' },
            { name: 'Years at Current Job', importance: 'Low', type: 'Numerical' },
            { name: 'Home Ownership', importance: 'Low', type: 'Categorical' },
            { name: 'Loan Purpose', importance: 'Low', type: 'Categorical' }
        ];
        
        const featuresBody = document.getElementById('features-body');
        featuresBody.innerHTML = '';
        
        features.forEach(feature => {
            const row = document.createElement('tr');
            
            // Determine importance class
            let importanceClass = '';
            if (feature.importance === 'High') importanceClass = 'importance-high';
            if (feature.importance === 'Medium') importanceClass = 'importance-medium';
            if (feature.importance === 'Low') importanceClass = 'importance-low';
            
            row.innerHTML = `
                <td>${feature.name}</td>
                <td><span class="feature-importance ${importanceClass}">${feature.importance}</span></td>
                <td>${feature.type}</td>
            `;
            featuresBody.appendChild(row);
        });
        
        // Generate sample decision tree visualization
        generateDecisionTree();
    }
    
    function generateDecisionTree() {
        // Clear previous diagram
        document.getElementById('tree-diagram').innerHTML = '';
        
        const treeData = {
            name: "Credit Score ≥ 720?",
            value: "All Data (1,204)",
            children: [
                {
                    name: "Income ≥ $80K?",
                    value: "Score ≥ 720 (843)",
                    children: [
                        {
                            name: "APPROVED",
                            value: "Income ≥ $80K (642)",
                            style: "fill: var(--success);",
                            leaf: true
                        },
                        {
                            name: "Debt Ratio ≤ 35%?",
                            value: "Income < $80K (201)",
                            children: [
                                {
                                    name: "APPROVED",
                                    value: "Debt Ratio ≤ 35% (128)",
                                    style: "fill: var(--success);",
                                    leaf: true
                                },
                                {
                                    name: "REVIEW",
                                    value: "Debt Ratio > 35% (73)",
                                    style: "fill: var(--warning);",
                                    leaf: true
                                }
                            ]
                        }
                    ]
                },
                {
                    name: "Income ≥ $60K?",
                    value: "Score < 720 (361)",
                    children: [
                        {
                            name: "REVIEW",
                            value: "Income ≥ $60K (189)",
                            style: "fill: var(--warning);",
                            leaf: true
                        },
                        {
                            name: "DENIED",
                            value: "Income < $60K (172)",
                            style: "fill: var(--danger);",
                            leaf: true
                        }
                    ]
                }
            ]
        };
        
        // Set dimensions and margins for diagram
        const container = document.getElementById('tree-diagram');
        const width = container.offsetWidth;
        const height = container.offsetHeight;
        const margin = {top: 40, right: 120, bottom: 50, left: 120};
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;
        
        // Append SVG object
        const svg = d3.select("#tree-diagram")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        
        // Create tree layout
        const treemap = d3.tree().size([innerHeight, innerWidth]);
        
        // Assign data to hierarchy
        const root = d3.hierarchy(treeData);
        
        // Create curved links
        const linkGenerator = d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x);
        
        // Compute tree layout
        treemap(root);
        
        // Add links between nodes
        svg.selectAll('.link')
            .data(root.links())
            .enter()
            .append('path')
            .attr('class', 'link')
            .attr('d', linkGenerator)
            .attr('fill', 'none')
            .attr('stroke', '#64748b')
            .attr('stroke-width', 2)
            .attr('stroke-opacity', 0.7);
        
        // Add each node
        const node = svg.selectAll('.node')
            .data(root.descendants())
            .enter()
            .append('g')
            .attr('class', d => `node${d.children ? ' node--internal' : ' node--leaf'}`)
            .attr('transform', d => `translate(${d.y},${d.x})`);
        
        // Add node circles
        node.append('circle')
            .attr('r', 20)
            .attr('fill', d => d.data.style ? d.data.style.split('fill: ')[1].replace(');', '') : '#6366f1')
            .attr('stroke', d => d.data.leaf ? 'rgba(255,255,255,0.2)' : '#1e293b')
            .attr('stroke-width', 3)
            .attr('class', 'node-circle');
        
        // Add node text
        node.append('text')
            .attr('dy', d => d.data.leaf ? '0.35em' : '-1.5em')
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .attr('font-size', '13px')
            .attr('font-weight', '600')
            .text(d => d.data.name)
            .attr('class', 'node-name');
        
        // Add value text
        node.append('text')
            .attr('dy', d => d.data.leaf ? '1.5em' : '1.8em')
            .attr('text-anchor', 'middle')
            .attr('fill', '#94a3b8')
            .attr('font-size', '11px')
            .text(d => d.data.value)
            .attr('class', 'node-value');
        
        // Add hover effects
        node.on('mouseover', function() {
            d3.select(this).select('.node-circle')
                .transition()
                .duration(200)
                .attr('r', 24);
            
            d3.select(this).select('.node-name')
                .transition()
                .duration(200)
                .attr('font-size', '14px');
        });
        
        node.on('mouseout', function() {
            d3.select(this).select('.node-circle')
                .transition()
                .duration(200)
                .attr('r', 20);
            
            d3.select(this).select('.node-name')
                .transition()
                .duration(200)
                .attr('font-size', '13px');
        });
    }
});

