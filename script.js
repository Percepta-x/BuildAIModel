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
    const progressBar = document.getElementById('progress-bar');
    const timeLeft = document.getElementById('time-left');
    
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
        
        // Reset progress bar
        progressBar.style.width = '0%';
        timeLeft.textContent = '20';
        
        // Show loading state
        loading.style.display = 'block';
        processBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        processBtn.disabled = true;
        
        // Start progress simulation
        let progress = 0;
        const intervalId = setInterval(() => {
            progress += 5;
            progressBar.style.width = `${progress}%`;
            
            // Update time estimation
            const remainingTime = 20 - (progress / 5);
            timeLeft.textContent = Math.max(0, Math.floor(remainingTime));
            
            if (progress >= 100) {
                clearInterval(intervalId);
            }
        }, 1000);
        
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
                
                // Clear progress interval when done
                clearInterval(intervalId);
                progressBar.style.width = '100%';
                
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
                // Clear progress interval on error
                clearInterval(intervalId);
                alert('Error processing file: ' + error.message);
                loading.style.display = 'none';
                processBtn.innerHTML = '<i class="fas fa-cogs"></i> Process Data';
                processBtn.disabled = false;
            }
        };
        
        reader.onerror = function() {
            // Clear progress interval on error
            clearInterval(intervalId);
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
    
    function generateTree() {
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
        
        // Build decision tree model with actual data
        buildDecisionTreeModel(targetColumn, ignoredColumns, problemType);
        
        // Hide loading
        loading.style.display = 'none';
        
        // Generate visualization
        generateVisualization(targetColumn, problemType);
        
        // Show results
        resultsContainer.style.display = 'block';
        
        // Scroll to results
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
        
        // Generate prediction form
        generatePredictionForm(ignoredColumns, targetColumn);
    }
    
    // Simple decision tree implementation
    function buildDecisionTreeModel(targetColumn, ignoredColumns, problemType) {
        // Get features to include
        const features = columns.filter(col => 
            col !== targetColumn && !ignoredColumns.includes(col)
        );
        
        // Prepare data
        const data = parsedData.map(row => {
            const newRow = {};
            features.forEach(feature => {
                newRow[feature] = row[feature];
            });
            newRow[targetColumn] = row[targetColumn];
            return newRow;
        });
        
        // Create a simple decision tree model
        decisionTreeModel = {
            target: targetColumn,
            problemType: problemType,
            features: features,
            root: buildTree(data, features, targetColumn, problemType, 0, 3),
            stats: {
                rows: parsedData.length,
                features: features.length,
                nodes: countNodes(decisionTreeModel.root)
            }
        };
    }
    
    function buildTree(data, features, target, problemType, depth, maxDepth) {
        // Stopping conditions
        if (depth >= maxDepth || data.length <= 2 || features.length === 0) {
            return createLeaf(data, target, problemType);
        }
        
        // Find best split
        let bestFeature = null;
        let bestSplitValue = null;
        let bestGain = -Infinity;
        let bestPartitions = null;
        
        for (const feature of features) {
            if (featureTypes[feature] === 'Numerical') {
                // For numerical features, try median as split point
                const values = data.map(row => row[feature]).filter(v => !isNaN(v));
                if (values.length === 0) continue;
                
                const sorted = [...values].sort((a, b) => a - b);
                const median = sorted[Math.floor(sorted.length / 2)];
                
                const partitions = {
                    left: data.filter(row => row[feature] <= median),
                    right: data.filter(row => row[feature] > median)
                };
                
                const gain = calculateGain(data, partitions, target, problemType);
                
                if (gain > bestGain) {
                    bestGain = gain;
                    bestFeature = feature;
                    bestSplitValue = median;
                    bestPartitions = partitions;
                }
            } else {
                // For categorical features, split on each category
                const categories = [...new Set(data.map(row => row[feature]))];
                
                for (const category of categories) {
                    const partitions = {
                        left: data.filter(row => row[feature] === category),
                        right: data.filter(row => row[feature] !== category)
                    };
                    
                    const gain = calculateGain(data, partitions, target, problemType);
                    
                    if (gain > bestGain) {
                        bestGain = gain;
                        bestFeature = feature;
                        bestSplitValue = category;
                        bestPartitions = partitions;
                    }
                }
            }
        }
        
        // If no good split found, create leaf
        if (!bestFeature || bestPartitions.left.length === 0 || bestPartitions.right.length === 0) {
            return createLeaf(data, target, problemType);
        }
        
        // Build subtrees
        const remainingFeatures = features.filter(f => f !== bestFeature);
        
        return {
            feature: bestFeature,
            value: bestSplitValue,
            type: featureTypes[bestFeature],
            gain: bestGain,
            children: [
                buildTree(bestPartitions.left, remainingFeatures, target, problemType, depth + 1, maxDepth),
                buildTree(bestPartitions.right, remainingFeatures, target, problemType, depth + 1, maxDepth)
            ]
        };
    }
    
    function createLeaf(data, target, problemType) {
        if (problemType === 'classification') {
            // Count class frequencies
            const counts = {};
            data.forEach(row => {
                const value = row[target];
                counts[value] = (counts[value] || 0) + 1;
            });
            
            // Find majority class
            let majorityClass = null;
            let maxCount = 0;
            for (const [cls, count] of Object.entries(counts)) {
                if (count > maxCount) {
                    maxCount = count;
                    majorityClass = cls;
                }
            }
            
            const confidence = (maxCount / data.length * 100).toFixed(1);
            
            return {
                leaf: true,
                value: majorityClass,
                confidence: confidence,
                count: data.length
            };
        } else {
            // Calculate mean for regression
            const values = data.map(row => row[target]).filter(v => !isNaN(v));
            const mean = values.length > 0 ? 
                values.reduce((a, b) => a + b, 0) / values.length : 0;
                
            return {
                leaf: true,
                value: mean.toFixed(2),
                count: data.length
            };
        }
    }
    
    function calculateGain(data, partitions, target, problemType) {
        if (problemType === 'classification') {
            return informationGain(data, partitions, target);
        } else {
            return varianceReduction(data, partitions, target);
        }
    }
    
    function informationGain(data, partitions, target) {
        // Calculate parent entropy
        const parentCounts = {};
        data.forEach(row => {
            const value = row[target];
            parentCounts[value] = (parentCounts[value] || 0) + 1;
        });
        
        let parentEntropy = 0;
        const total = data.length;
        for (const count of Object.values(parentCounts)) {
            const p = count / total;
            parentEntropy -= p * Math.log2(p);
        }
        
        // Calculate children entropy
        let childrenEntropy = 0;
        for (const part of Object.values(partitions)) {
            if (part.length === 0) continue;
            
            const childCounts = {};
            part.forEach(row => {
                const value = row[target];
                childCounts[value] = (childCounts[value] || 0) + 1;
            });
            
            let entropy = 0;
            for (const count of Object.values(childCounts)) {
                const p = count / part.length;
                entropy -= p * Math.log2(p);
            }
            
            childrenEntropy += (part.length / total) * entropy;
        }
        
        return parentEntropy - childrenEntropy;
    }
    
    function varianceReduction(data, partitions, target) {
        // Calculate parent variance
        const values = data.map(row => row[target]);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const parentVariance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        
        // Calculate children variance
        let childrenVariance = 0;
        let total = data.length;
        
        for (const part of Object.values(partitions)) {
            if (part.length === 0) continue;
            
            const partValues = part.map(row => row[target]);
            const partMean = partValues.reduce((a, b) => a + b, 0) / partValues.length;
            const variance = partValues.reduce((sum, val) => sum + Math.pow(val - partMean, 2), 0) / partValues.length;
            
            childrenVariance += (partValues.length / total) * variance;
        }
        
        return parentVariance - childrenVariance;
    }
    
    function countNodes(node) {
        if (node.leaf) return 1;
        return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
    }
    
    function generateVisualization(targetColumn, problemType) {
        // Clear previous diagram
        document.getElementById('tree-diagram').innerHTML = '';
        
        // Update stats
        document.getElementById('stat-rows').textContent = 
            parsedData.length.toLocaleString();
        document.getElementById('stat-cols').textContent = 
            decisionTreeModel.features.length;
        document.getElementById('stat-nodes').textContent = 
            decisionTreeModel.stats.nodes;
        
        // Create tree data for visualization
        const treeData = convertToD3Tree(decisionTreeModel.root, targetColumn, problemType);
        
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
            .attr('fill', d => d.data.leaf ? 
                (problemType === 'classification' ? '#10b981' : '#6366f1') : 
                '#8b5cf6')
            .attr('stroke', '#1e293b')
            .attr('stroke-width', 3);
        
        // Add node text
        node.append('text')
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .attr('font-size', '11px')
            .attr('font-weight', '600')
            .text(d => d.data.name)
            .call(wrapText, 100);
        
        // Add value text
        node.append('text')
            .attr('dy', '1.5em')
            .attr('text-anchor', 'middle')
            .attr('fill', '#94a3b8')
            .attr('font-size', '10px')
            .text(d => d.data.value);
    }
    
    function convertToD3Tree(node, target, problemType, depth = 0) {
        if (node.leaf) {
            return {
                name: problemType === 'classification' ? 
                    `${node.value}` : 
                    `${node.value}`,
                value: problemType === 'classification' ?
                    `${node.confidence}% confidence` :
                    `Count: ${node.count}`,
                leaf: true
            };
        }
        
        return {
            name: `${node.feature} ${node.type === 'Numerical' ? '≤' : '='} ${node.value}`,
            value: `Gain: ${node.gain.toFixed(2)}`,
            children: [
                convertToD3Tree(node.children[0], target, problemType, depth + 1),
                convertToD3Tree(node.children[1], target, problemType, depth + 1)
            ]
        };
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
        
        // Make prediction using the tree
        const prediction = predictWithTree(decisionTreeModel.root, inputs);
        
        // Display prediction result
        const resultContainer = document.querySelector('.prediction-result');
        if (!resultContainer) {
            const newResult = document.createElement('div');
            newResult.className = 'prediction-result';
            
            if (decisionTreeModel.problemType === 'classification') {
                newResult.innerHTML = `
                    <h4>Prediction Result</h4>
                    <div class="prediction-value">${prediction.value}</div>
                    <p>Confidence: ${prediction.confidence}%</p>
                `;
            } else {
                newResult.innerHTML = `
                    <h4>Prediction Result</h4>
                    <div class="prediction-value">${prediction.value}</div>
                    <p>Based on ${prediction.count} similar records</p>
                `;
            }
            
            document.querySelector('.prediction-form').insertAdjacentElement('afterend', newResult);
        } else {
            if (decisionTreeModel.problemType === 'classification') {
                resultContainer.innerHTML = `
                    <h4>Prediction Result</h4>
                    <div class="prediction-value">${prediction.value}</div>
                    <p>Confidence: ${prediction.confidence}%</p>
                `;
            } else {
                resultContainer.innerHTML = `
                    <h4>Prediction Result</h4>
                    <div class="prediction-value">${prediction.value}</div>
                    <p>Based on ${prediction.count} similar records</p>
                `;
            }
        }
        
        // Scroll to result
        document.querySelector('.prediction-result').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center'
        });
    }
    
    function predictWithTree(node, inputs) {
        if (node.leaf) {
            return node;
        }
        
        const featureValue = inputs[node.feature];
        let goLeft = false;
        
        if (node.type === 'Numerical') {
            goLeft = featureValue <= node.value;
        } else {
            goLeft = featureValue === node.value;
        }
        
        return predictWithTree(node.children[goLeft ? 0 : 1], inputs);
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
