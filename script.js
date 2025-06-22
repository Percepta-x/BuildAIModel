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
    const configPanel = document.getElementById('config-panel');
    const targetColumnSelect = document.getElementById('target-column');
    const ignoreColumnsContainer = document.getElementById('ignore-columns');
    const previewHeader = document.getElementById('preview-header');
    const previewBody = document.getElementById('preview-body');
    const generateTreeBtn = document.getElementById('generate-tree-btn');
    const regenerateBtn = document.getElementById('regenerate-btn');
    const newAnalysisBtn = document.getElementById('new-analysis-btn');
    const problemTypeSelect = document.getElementById('problem-type');
    
    // Global variables
    let parsedData = null;
    let columns = [];
    
    // Event listeners
    browseBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    changeFileBtn.addEventListener('click', () => fileInput.click());
    processBtn.addEventListener('click', processFile);
    generateTreeBtn.addEventListener('click', generateTree);
    regenerateBtn.addEventListener('click', () => generateTree(true));
    newAnalysisBtn.addEventListener('click', resetAnalysis);
    
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
        if (files.length) {
            fileInput.files = files;
            handleFileSelect();
        }
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
        if (!fileInput.files.length) {
            alert('Please select a file first!');
            return;
        }
        
        // Show loading state
        loading.style.display = 'block';
        processBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        processBtn.disabled = true;
        
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const content = e.target.result;
                const ext = file.name.split('.').pop().toLowerCase();
                
                if (ext === 'csv') {
                    // Parse CSV data
                    parsedData = parseCSV(content);
                } else if (ext === 'json') {
                    // Parse JSON data
                    parsedData = JSON.parse(content);
                } else {
                    throw new Error('Unsupported file format');
                }
                
                if (!parsedData || parsedData.length === 0) {
                    throw new Error('No data found in the file');
                }
                
                // Process the data
                processData(parsedData);
                
                // Hide loading
                loading.style.display = 'none';
                
                // Show config panel
                configPanel.style.display = 'block';
                
                // Scroll to config panel
                configPanel.scrollIntoView({ behavior: 'smooth' });
                
                // Reset button
                processBtn.innerHTML = '<i class="fas fa-cogs"></i> Process Data';
                processBtn.disabled = false;
                
            } catch (error) {
                console.error('Error processing file:', error);
                alert('Error processing file: ' + error.message);
                loading.style.display = 'none';
                processBtn.innerHTML = '<i class="fas fa-cogs"></i> Process Data';
                processBtn.disabled = false;
            }
        };
        
        reader.onerror = function() {
            alert('Error reading file');
            loading.style.display = 'none';
            processBtn.innerHTML = '<i class="fas fa-cogs"></i> Process Data';
            processBtn.disabled = false;
        };
        
        reader.readAsText(file);
    }
    
    function parseCSV(content) {
        // Parse CSV using PapaParse
        const results = Papa.parse(content, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
        });
        
        if (results.errors.length > 0) {
            console.warn('CSV parsing errors:', results.errors);
        }
        
        return results.data;
    }
    
    function processData(data) {
        // Extract columns from first row
        columns = Object.keys(data[0]);
        
        // Populate target column dropdown
        targetColumnSelect.innerHTML = '';
        columns.forEach(col => {
            const option = document.createElement('option');
            option.value = col;
            option.textContent = col;
            targetColumnSelect.appendChild(option);
        });
        
        // Populate ignore columns checkboxes
        ignoreColumnsContainer.innerHTML = '';
        columns.forEach(col => {
            const div = document.createElement('div');
            div.className = 'checkbox-item';
            
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.id = `ignore-${col}`;
            input.value = col;
            
            const label = document.createElement('label');
            label.htmlFor = `ignore-${col}`;
            label.textContent = col;
            
            div.appendChild(input);
            div.appendChild(label);
            ignoreColumnsContainer.appendChild(div);
        });
        
        // Show data preview
        showDataPreview(data);
    }
    
    function showDataPreview(data) {
        previewHeader.innerHTML = '';
        previewBody.innerHTML = '';
        
        // Create header row
        const headerRow = document.createElement('tr');
        columns.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col;
            headerRow.appendChild(th);
        });
        previewHeader.appendChild(headerRow);
        
        // Create data rows (show max 10 rows)
        const previewRows = Math.min(10, data.length);
        for (let i = 0; i < previewRows; i++) {
            const row = document.createElement('tr');
            columns.forEach(col => {
                const td = document.createElement('td');
                const value = data[i][col];
                td.textContent = value !== undefined ? 
                    (typeof value === 'string' ? value : JSON.stringify(value)) : '';
                row.appendChild(td);
            });
            previewBody.appendChild(row);
        }
    }
    
    function generateTree(regenerate = false) {
        // Show loading state
        loading.style.display = 'block';
        configPanel.style.display = 'none';
        
        // Get configuration
        const targetColumn = targetColumnSelect.value;
        const problemType = problemTypeSelect.value;
        
        if (!targetColumn) {
            alert('Please select a target column!');
            loading.style.display = 'none';
            configPanel.style.display = 'block';
            return;
        }
        
        // Get ignored columns
        const ignoredColumns = [];
        document.querySelectorAll('#ignore-columns input:checked').forEach(input => {
            ignoredColumns.push(input.value);
        });
        
        // Simulate processing delay
        setTimeout(() => {
            // Hide loading
            loading.style.display = 'none';
            
            // Generate sample data for visualization
            generateSampleData(targetColumn, ignoredColumns, problemType);
            
            // Show results
            resultsContainer.style.display = 'block';
            
            // Scroll to results
            resultsContainer.scrollIntoView({ behavior: 'smooth' });
        }, 2000);
    }
    
    function generateSampleData(targetColumn, ignoredColumns, problemType) {
        // Update stats
        const rowCount = parsedData ? parsedData.length : 1204;
        const featureCount = columns ? columns.length - ignoredColumns.length - 1 : 12;
        
        document.getElementById('stat-rows').textContent = rowCount.toLocaleString();
        document.getElementById('stat-cols').textContent = featureCount;
        document.getElementById('stat-nodes').textContent = Math.floor(rowCount / 50);
        document.getElementById('stat-accuracy').textContent = problemType === 'classification' 
            ? `${Math.floor(85 + Math.random() * 15)}%` 
            : `R²: 0.${Math.floor(80 + Math.random() * 15)}`;
        
        // Populate features table
        const featuresBody = document.getElementById('features-body');
        featuresBody.innerHTML = '';
        
        // Determine feature importance
        columns.forEach(col => {
            if (col !== targetColumn && !ignoredColumns.includes(col)) {
                // Assign random importance for demo
                const importanceVal = Math.random();
                let importance;
                let importanceClass;
                
                if (importanceVal > 0.7) {
                    importance = 'High';
                    importanceClass = 'importance-high';
                } else if (importanceVal > 0.4) {
                    importance = 'Medium';
                    importanceClass = 'importance-medium';
                } else {
                    importance = 'Low';
                    importanceClass = 'importance-low';
                }
                
                // Determine type
                const isCategorical = Math.random() > 0.5;
                const type = isCategorical ? 'Categorical' : 'Numerical';
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${col}</td>
                    <td><span class="feature-importance ${importanceClass}">${importance}</span></td>
                    <td>${type}</td>
                `;
                featuresBody.appendChild(row);
            }
        });
        
        // Generate sample decision tree visualization
        generateDecisionTree(targetColumn, problemType);
    }
    
    function generateDecisionTree(targetColumn, problemType) {
        // Clear previous diagram
        document.getElementById('tree-diagram').innerHTML = '';
        
        // Create tree data based on problem type
        let treeData;
        if (problemType === 'classification') {
            treeData = {
                name: `${targetColumn}?`,
                value: "All Data",
                children: [
                    {
                        name: "Feature A > 50?",
                        value: "Yes (65%)",
                        children: [
                            {
                                name: "Class 1",
                                value: "82%",
                                style: "fill: var(--success);",
                                leaf: true
                            },
                            {
                                name: "Feature B < 30?",
                                value: "No (35%)",
                                children: [
                                    {
                                        name: "Class 2",
                                        value: "70%",
                                        style: "fill: var(--warning);",
                                        leaf: true
                                    },
                                    {
                                        name: "Class 3",
                                        value: "30%",
                                        style: "fill: var(--danger);",
                                        leaf: true
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        name: "Feature C == 'X'?",
                        value: "No (35%)",
                        children: [
                            {
                                name: "Class 2",
                                value: "60%",
                                style: "fill: var(--warning);",
                                leaf: true
                            },
                            {
                                name: "Class 1",
                                value: "40%",
                                style: "fill: var(--success);",
                                leaf: true
                            }
                        ]
                    }
                ]
            };
        } else {
            treeData = {
                name: `${targetColumn} Prediction`,
                value: "All Data",
                children: [
                    {
                        name: "Income > $50K?",
                        value: "Yes (55%)",
                        children: [
                            {
                                name: "$72K ± $5K",
                                value: "R²: 0.85",
                                style: "fill: var(--primary);",
                                leaf: true
                            },
                            {
                                name: "Education > 16 yrs?",
                                value: "No (45%)",
                                children: [
                                    {
                                        name: "$65K ± $7K",
                                        value: "R²: 0.78",
                                        style: "fill: var(--accent);",
                                        leaf: true
                                    },
                                    {
                                        name: "$58K ± $9K",
                                        value: "R²: 0.65",
                                        style: "fill: var(--warning);",
                                        leaf: true
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        name: "Age < 30?",
                        value: "No (45%)",
                        children: [
                            {
                                name: "$82K ± $6K",
                                value: "R²: 0.88",
                                style: "fill: var(--primary);",
                                leaf: true
                            },
                            {
                                name: "$68K ± $8K",
                                value: "R²: 0.72",
                                style: "fill: var(--accent);",
                                leaf: true
                            }
                        ]
                    }
                ]
            };
        }
        
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
    
    function resetAnalysis() {
        // Reset the UI
        resultsContainer.style.display = 'none';
        configPanel.style.display = 'none';
        fileInfo.style.display = 'none';
        fileInput.value = '';
        
        // Clear data
        parsedData = null;
        columns = [];
        
        // Reset buttons
        processBtn.innerHTML = '<i class="fas fa-cogs"></i> Process Data';
        processBtn.disabled = false;
        
        // Clear preview
        previewHeader.innerHTML = '';
        previewBody.innerHTML = '';
        targetColumnSelect.innerHTML = '';
        ignoreColumnsContainer.innerHTML = '';
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});
