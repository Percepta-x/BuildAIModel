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
    let decisionTreeModel = null;
    let featureRanges = {};
    let featureTypes = {};
    
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
        
        // Calculate feature types and ranges
        calculateFeatureProperties(data);
        
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
    
    function calculateFeatureProperties(data) {
        featureTypes = {};
        featureRanges = {};
        
        columns.forEach(col => {
            // Check if column is numeric
            const firstValue = data[0][col];
            const isNumeric = typeof firstValue === 'number';
            
            featureTypes[col] = isNumeric ? 'Numerical' : 'Categorical';
            
            if (isNumeric) {
                // Calculate min, max, and mean for numerical columns
                const values = data.map(row => row[col]).filter(val => !isNaN(val));
                if (values.length > 0) {
                    featureRanges[col] = {
                        min: Math.min(...values),
                        max: Math.max(...values),
                        mean: values.reduce((a, b) => a + b, 0) / values.length
                    };
                }
            } else {
                // Get unique values for categorical columns
                const uniqueValues = [...new Set(data.map(row => row[col]))];
                featureRanges[col] = uniqueValues;
            }
        });
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
        
        // Build decision tree model
        buildDecisionTreeModel(targetColumn, ignoredColumns, problemType);
        
        // Simulate processing delay
        setTimeout(() => {
            // Hide loading
            loading.style.display = 'none';
            
            // Generate sample data for visualization
            generateVisualization(targetColumn, problemType);
            
            // Show results
            resultsContainer.style.display = 'block';
            
            // Scroll to results
            resultsContainer.scrollIntoView({ behavior: 'smooth' });
            
            // Generate prediction form
            generatePredictionForm(ignoredColumns, targetColumn);
            
            // Generate analytics
            generateAnalytics(targetColumn);
        }, 1500);
    }
    
    function buildDecisionTreeModel(targetColumn, ignoredColumns, problemType) {
        // In a real implementation, this would build an actual decision tree model
        // For this demo, we're creating a mock model that will be used for predictions
        decisionTreeModel = {
            target: targetColumn,
            problemType: problemType,
            features: columns.filter(col => col !== targetColumn && !ignoredColumns.includes(col)),
            root: {
                feature: problemType === 'classification' ? 'Age' : 'Income',
                threshold: problemType === 'classification' ? 45 : 50000,
                children: [
                    {
                        feature: problemType === 'classification' ? 'Education' : 'CreditScore',
                        threshold: problemType === 'classification' ? 'College' : 700,
                        value: problemType === 'classification' ? 'Approved' : 'High',
                        children: [
                            {
                                value: problemType === 'classification' ? 'Approved' : '65000'
                            },
                            {
                                value: problemType === 'classification' ? 'Rejected' : '45000'
                            }
                        ]
                    },
                    {
                        value: problemType === 'classification' ? 'Rejected' : '30000'
                    }
                ]
            }
        };
    }
    
    function generateVisualization(targetColumn, problemType) {
        // Clear previous diagram
        document.getElementById('tree-diagram').innerHTML = '';
        
        // Create tree data based on problem type
        const treeData = createTreeStructure(targetColumn, problemType);
        
        // Set dimensions and margins for diagram
        const container = document.getElementById('tree-diagram');
        const width = container.offsetWidth;
        const height = container.offsetHeight;
        
        // Append SVG object
        const svg = d3.select("#tree-diagram")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(50,20)");
        
        // Create tree layout
        const treemap = d3.tree().size([height - 100, width - 200]);
        
        // Assign data to hierarchy
        const root = d3.hierarchy(treeData);
        
        // Compute tree layout
        treemap(root);
        
        // Add links between nodes
        svg.selectAll('.link')
            .data(root.links())
            .enter()
            .append('path')
            .attr('class', 'link')
            .attr('d', d3.linkHorizontal()
                .x(d => d.y)
                .y(d => d.x)
            )
            .attr('fill', 'none')
            .attr('stroke', '#64748b')
            .attr('stroke-width', 2);
        
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
            .attr('stroke-width', 3);
        
        // Add node text
        node.append('text')
            .attr('dy', d => d.data.leaf ? '0.35em' : '-1.5em')
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .attr('font-size', '11px')
            .attr('font-weight', '600')
            .text(d => d.data.name)
            .call(wrapText, 100);
        
        // Add value text
        node.append('text')
            .attr('dy', d => d.data.leaf ? '1.5em' : '1.8em')
            .attr('text-anchor', 'middle')
            .attr('fill', '#94a3b8')
            .attr('font-size', '10px')
            .text(d => d.data.value);
        
        // Add hover effects
        node.on('mouseover', function() {
            d3.select(this).select('circle')
                .transition()
                .duration(200)
                .attr('r', 24);
            
            d3.select(this).select('text')
                .transition()
                .duration(200)
                .attr('font-size', '12px');
        });
        
        node.on('mouseout', function() {
            d3.select(this).select('circle')
                .transition()
                .duration(200)
                .attr('r', 20);
            
            d3.select(this).select('text')
                .transition()
                .duration(200)
                .attr('font-size', '11px');
        });
    }
    
    function wrapText(text, width) {
        text.each(function() {
            const text = d3.select(this);
            const words = text.text().split(/\s+/).reverse();
            let word;
            let line = [];
            let lineNumber = 0;
            const lineHeight = 1.1;
            const y = text.attr("y");
            const dy = parseFloat(text.attr("dy"));
            let tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
            
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                }
            }
        });
    }
    
    function createTreeStructure(targetColumn, problemType) {
        if (problemType === 'classification') {
            return {
                name: `${targetColumn}?`,
                value: "All Data",
                children: [
                    {
                        name: "Age > 45?",
                        value: "Yes (65%)",
                        children: [
                            {
                                name: "Education?",
                                value: "College",
                                children: [
                                    {
                                        name: "Approved",
                                        value: "82%",
                                        style: "fill: var(--success);",
                                        leaf: true
                                    },
                                    {
                                        name: "Rejected",
                                        value: "18%",
                                        style: "fill: var(--danger);",
                                        leaf: true
                                    }
                                ]
                            },
                            {
                                name: "Income > $50K?",
                                value: "No (35%)",
                                children: [
                                    {
                                        name: "Approved",
                                        value: "70%",
                                        style: "fill: var(--success);",
                                        leaf: true
                                    },
                                    {
                                        name: "Rejected",
                                        value: "30%",
                                        style: "fill: var(--danger);",
                                        leaf: true
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        name: "Credit Score > 700?",
                        value: "No (35%)",
                        children: [
                            {
                                name: "Approved",
                                value: "60%",
                                style: "fill: var(--success);",
                                leaf: true
                            },
                            {
                                name: "Rejected",
                                value: "40%",
                                style: "fill: var(--danger);",
                                leaf: true
                            }
                        ]
                    }
                ]
            };
        } else {
            return {
                name: `${targetColumn} Prediction`,
                value: "All Data",
                children: [
                    {
                        name: "Income > $50K?",
                        value: "Yes (55%)",
                        children: [
                            {
                                name: "Credit Score > 700?",
                                value: "Yes",
                                children: [
                                    {
                                        name: "$72K ± $5K",
                                        value: "R²: 0.85",
                                        style: "fill: var(--primary);",
                                        leaf: true
                                    },
                                    {
                                        name: "$65K ± $7K",
                                        value: "R²: 0.78",
                                        style: "fill: var(--accent);",
                                        leaf: true
                                    }
                                ]
                            },
                            {
                                name: "$58K ± $9K",
                                value: "R²: 0.65",
                                style: "fill: var(--warning);",
                                leaf: true
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
    }
    
    function generatePredictionForm(ignoredColumns, targetColumn) {
        const predictionForm = document.getElementById('prediction-form');
        predictionForm.innerHTML = '';
        
        // Get features to include in form
        const features = columns.filter(col => 
            col !== targetColumn && 
            !ignoredColumns.includes(col) && 
            col in featureTypes
        );
        
        // Create form structure
        let formHTML = `<div class="prediction-row">`;
        
        features.forEach((feature, index) => {
            formHTML += `
                <div class="prediction-group">
                    <label for="prediction-${feature}">${feature}</label>
            `;
            
            if (featureTypes[feature] === 'Numerical') {
                const range = featureRanges[feature];
                formHTML += `
                    <input type="number" id="prediction-${feature}" 
                           placeholder="${range.min} to ${range.max}" 
                           min="${range.min}" max="${range.max}" 
                           step="${(range.max - range.min)/100}">
                `;
            } else {
                const options = featureRanges[feature].map(val => 
                    `<option value="${val}">${val}</option>`
                ).join('');
                formHTML += `
                    <select id="prediction-${feature}">
                        <option value="">Select value</option>
                        ${options}
                    </select>
                `;
            }
            
            formHTML += `</div>`;
            
            // Split into 2 columns
            if ((index + 1) % 2 === 0 && index < features.length - 1) {
                formHTML += `</div><div class="prediction-row">`;
            }
        });
        
        formHTML += `</div>`;
        formHTML += `
            <button class="btn" id="predict-btn" style="margin-top: 15px;">
                <i class="fas fa-bolt"></i> Predict ${targetColumn}
            </button>
        `;
        
        predictionForm.innerHTML = formHTML;
        
        // Add event listener to predict button
        document.getElementById('predict-btn').addEventListener('click', makePrediction);
    }
    
    function makePrediction() {
        if (!decisionTreeModel) {
            alert('Please generate the decision tree first');
            return;
        }
        
        const inputs = {};
        const features = decisionTreeModel.features;
        
        // Collect input values
        let valid = true;
        features.forEach(feature => {
            const input = document.getElementById(`prediction-${feature}`);
            let value = input.value;
            
            if (value === '') {
                valid = false;
                input.style.borderColor = 'var(--danger)';
            } else {
                input.style.borderColor = '';
                // Convert to number if numerical
                if (featureTypes[feature] === 'Numerical') {
                    value = parseFloat(value);
                }
                inputs[feature] = value;
            }
        });
        
        if (!valid) {
            alert('Please fill in all fields');
            return;
        }
        
        // Make prediction using the mock model
        const prediction = predictWithTree(inputs);
        
        // Display prediction result
        const resultContainer = document.querySelector('.prediction-result');
        if (!resultContainer) {
            const newResult = document.createElement('div');
            newResult.className = 'prediction-result';
            newResult.innerHTML = `
                <h4>Prediction Result</h4>
                <div class="prediction-value">${prediction}</div>
                <p>Based on the decision tree model</p>
            `;
            document.querySelector('.prediction-form').insertAdjacentElement('afterend', newResult);
        } else {
            resultContainer.innerHTML = `
                <h4>Prediction Result</h4>
                <div class="prediction-value">${prediction}</div>
                <p>Based on the decision tree model</p>
            `;
        }
        
        // Scroll to result
        document.querySelector('.prediction-result').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center'
        });
    }
    
    function predictWithTree(inputs) {
        // This is a simplified mock prediction based on the mock tree structure
        // In a real implementation, you would traverse the actual decision tree
        
        if (decisionTreeModel.problemType === 'classification') {
            if (inputs.Age > 45) {
                if (inputs.Education === 'College') {
                    return 'Approved (82% confidence)';
                } else {
                    if (inputs.Income > 50000) {
                        return 'Approved (70% confidence)';
                    } else {
                        return 'Rejected (65% confidence)';
                    }
                }
            } else {
                if (inputs['Credit Score'] > 700) {
                    return 'Approved (60% confidence)';
                } else {
                    return 'Rejected (85% confidence)';
                }
            }
        } else {
            if (inputs.Income > 50000) {
                if (inputs['Credit Score'] > 700) {
                    return '$72,000 ± $5,000';
                } else {
                    return '$65,000 ± $7,000';
                }
            } else {
                if (inputs.Age < 30) {
                    return '$82,000 ± $6,000';
                } else {
                    return '$68,000 ± $8,000';
                }
            }
        }
    }
    
    function generateAnalytics(targetColumn) {
        // Generate mock analytics
        generateTargetDistribution(targetColumn);
        generateFeatureImportance();
        generateFeatureCorrelations();
    }
    
    function generateTargetDistribution(targetColumn) {
        const container = document.getElementById('target-distribution');
        container.innerHTML = '<div class="analytics-chart" id="target-distribution-chart"></div>';
        
        const width = 400;
        const height = 250;
        const margin = {top: 20, right: 20, bottom: 40, left: 40};
        
        // Sample data
        const data = [
            {label: 'Approved', value: 65},
            {label: 'Rejected', value: 25},
            {label: 'Pending', value: 10}
        ];
        
        const svg = d3.select("#target-distribution-chart")
            .append("svg")
            .attr("width", width)
            .attr("height", height);
        
        const x = d3.scaleBand()
            .domain(data.map(d => d.label))
            .range([margin.left, width - margin.right])
            .padding(0.1);
        
        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.value)])
            .range([height - margin.bottom, margin.top]);
        
        // Add bars
        svg.selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
            .attr("x", d => x(d.label))
            .attr("y", d => y(d.value))
            .attr("width", x.bandwidth())
            .attr("height", d => height - margin.bottom - y(d.value))
            .attr("fill", (d, i) => 
                d.label === 'Approved' ? 'var(--success)' : 
                d.label === 'Rejected' ? 'var(--danger)' : 'var(--warning)'
            );
        
        // Add labels
        svg.selectAll("text")
            .data(data)
            .enter()
            .append("text")
            .text(d => d.value + "%")
            .attr("x", d => x(d.label) + x.bandwidth()/2)
            .attr("y", d => y(d.value) - 5)
            .attr("text-anchor", "middle")
            .attr("fill", "white");
        
        // Add x axis
        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("fill", "var(--light-2)");
        
        // Add y axis
        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).ticks(5).tickFormat(d => d + "%"))
            .attr("color", "var(--light-2)");
    }
    
    function generateFeatureImportance() {
        const container = document.getElementById('feature-importance');
        container.innerHTML = '<div class="analytics-chart" id="feature-importance-chart"></div>';
        
        const width = 400;
        const height = 250;
        const margin = {top: 20, right: 20, bottom: 40, left: 100};
        
        // Sample data
        const data = [
            {feature: 'Income', importance: 85},
            {feature: 'Credit Score', importance: 72},
            {feature: 'Age', importance: 65},
            {feature: 'Education', importance: 58},
            {feature: 'Employment', importance: 42}
        ];
        
        const svg = d3.select("#feature-importance-chart")
            .append("svg")
            .attr("width", width)
            .attr("height", height);
        
        const y = d3.scaleBand()
            .domain(data.map(d => d.feature))
            .range([margin.top, height - margin.bottom])
            .padding(0.1);
        
        const x = d3.scaleLinear()
            .domain([0, 100])
            .range([margin.left, width - margin.right]);
        
        // Add bars
        svg.selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
            .attr("y", d => y(d.feature))
            .attr("x", margin.left)
            .attr("width", d => x(d.importance) - margin.left)
            .attr("height", y.bandwidth())
            .attr("fill", "var(--primary)");
        
        // Add labels
        svg.selectAll("text")
            .data(data)
            .enter()
            .append("text")
            .text(d => d.importance + "%")
            .attr("x", d => x(d.importance) + 5)
            .attr("y", d => y(d.feature) + y.bandwidth()/2)
            .attr("dy", "0.35em")
            .attr("fill", "white");
        
        // Add y axis
        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y))
            .attr("color", "var(--light-2)");
        
        // Add x axis
        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(5).tickFormat(d => d + "%"))
            .attr("color", "var(--light-2)");
    }
    
    function generateFeatureCorrelations() {
        const container = document.getElementById('feature-correlations');
        container.innerHTML = '<div class="analytics-chart" id="feature-correlations-chart"></div>';
        
        const width = 400;
        const height = 250;
        const margin = {top: 40, right: 40, bottom: 40, left: 40};
        
        // Sample data
        const data = [
            {x: 30, y: 45000},
            {x: 35, y: 55000},
            {x: 40, y: 65000},
            {x: 45, y: 75000},
            {x: 50, y: 80000},
            {x: 55, y: 85000},
            {x: 60, y: 75000},
            {x: 65, y: 70000}
        ];
        
        const svg = d3.select("#feature-correlations-chart")
            .append("svg")
            .attr("width", width)
            .attr("height", height);
        
        const x = d3.scaleLinear()
            .domain([20, 70])
            .range([margin.left, width - margin.right]);
        
        const y = d3.scaleLinear()
            .domain([30000, 90000])
            .range([height - margin.bottom, margin.top]);
        
        // Add dots
        svg.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", d => x(d.x))
            .attr("cy", d => y(d.y))
            .attr("r", 5)
            .attr("fill", "var(--primary)");
        
        // Add regression line
        const regression = regression.linear(data.map(d => [d.x, d.y]));
        const lineData = [
            {x: 20, y: regression.predict(20)[1]},
            {x: 70, y: regression.predict(70)[1]}
        ];
        
        const line = d3.line()
            .x(d => x(d.x))
            .y(d => y(d.y));
        
        svg.append("path")
            .datum(lineData)
            .attr("d", line)
            .attr("fill", "none")
            .attr("stroke", "var(--warning)")
            .attr("stroke-width", 2);
        
        // Add x axis
        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x))
            .attr("color", "var(--light-2)");
        
        // Add y axis
        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).tickFormat(d => '$' + d/1000 + 'K'))
            .attr("color", "var(--light-2)");
        
        // Add title
        svg.append("text")
            .attr("x", width/2)
            .attr("y", margin.top/2)
            .attr("text-anchor", "middle")
            .text("Income vs. Age Correlation")
            .attr("fill", "var(--light-2)");
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
        decisionTreeModel = null;
        featureRanges = {};
        featureTypes = {};
        
        // Reset buttons
        processBtn.innerHTML = '<i class="fas fa-cogs"></i> Process Data';
        processBtn.disabled = false;
        
        // Clear preview
        previewHeader.innerHTML = '';
        previewBody.innerHTML = '';
        targetColumnSelect.innerHTML = '';
        ignoreColumnsContainer.innerHTML = '';
        
        // Clear prediction form and result
        document.getElementById('prediction-form').innerHTML = '';
        const resultContainer = document.querySelector('.prediction-result');
        if (resultContainer) resultContainer.remove();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});
