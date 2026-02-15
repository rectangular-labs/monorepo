# Project Mind Mapping - Methodology Guide

A comprehensive guide for creating interconnected mind map documentation that captures both the current state and evolutionary history of software projects.

## Overview

Mind maps transform complex codebases into navigable knowledge graphs where each node represents a key concept and links create an interconnected understanding web. This methodology combines architectural analysis with historical context to create living documentation.

## Mind Map Format

### Usage Instructions Header

**Every MIND_MAP.md file must start with this exact text at the very top before any nodes:**

```markdown
> **For AI Agents:** This mind map is your primary knowledge index. Read overview nodes [1-5] first, then follow links [N] to find what you need. Always reference node IDs. When you encounter bugs, document your attempts in relevant nodes. When you make changes, update outdated nodes immediately—especially overview nodes since they're your springboard. Add new nodes only for genuinely new concepts. Keep it compact (20-50 nodes typical). The mind map wraps every task: consult it, rely on it, update it.
```

### Node Structure

Each node follows this structure:

```markdown
[Node Number] **Node Title** - Node text where you add [<link-nr>] links embedded naturally in the text. Text should be moderate size (3-8 sentences), dense with information but readable.
```

### Key Principles:

1. **Natural Link Integration**: Links [1][2][3] should flow naturally within sentences, not just listed at the end
2. **Moderate Density**: Each node should be substantial but scannable - aim for 100-300 words
3. **Semantic Grouping**: Related concepts should link bidirectionally to create knowledge clusters
4. **Progressive Detail**: Start with high-level concepts, drill down to implementation details
5. **Cross-References**: Every node should link to at least 2-3 other nodes; important nodes link to 5-10

## Phase 1: Current State Analysis

### Step 1: Initial Reconnaissance

Start with broad exploration to understand project structure:

```bash
# Explore project layout
ls -la
find . -type f -name "*.md" | head -20
find . -type f -name "README*"
find . -type f -name "package.json"
find . -type f -name "*.config.*"
```

**Read these first:**
- README files (project overview, setup, usage)
- Documentation files in docs/ or top-level
- Configuration files (package.json, tsconfig.json, etc.)
- TODO or ROADMAP files

### Step 2: Architecture Discovery

Use semantic search and file reading to understand:

**Core Components:**
```bash
# Find entry points
grep -r "main\|index\|app" --include="*.{ts,tsx,js,jsx,py}" -l

# Identify key directories
ls -d */ | grep -v node_modules
```

**Technology Stack:**
- Frontend: Look for React, Vue, Angular, etc. in package.json
- Backend: Express, Flask, FastAPI, etc.
- Build tools: Vite, Webpack, etc.
- Key libraries: Check dependencies

**Data Flow:**
Use `codebase_search` to trace:
- "How does data flow from input to output?"
- "Where is the main state managed?"
- "How do components communicate?"

### Step 3: Feature Mapping

Identify major features by exploring:
- Component files in src/components/
- API endpoints in server/routes/ or similar
- Utility functions in src/utils/
- Data models in types/ or models/

For each feature, understand:
- **What**: What does it do?
- **How**: Implementation approach
- **Why**: Design decisions
- **Dependencies**: What it connects to

### Step 4: Implementation Details

Dive into key algorithms, patterns, and systems:

```bash
# Find interesting implementations
grep -r "class\|function\|const.*=.*=>|def " --include="*.{ts,js,py}"

# Look for comments explaining complex logic
grep -r "TODO\|FIXME\|NOTE\|IMPORTANT" --include="*.{ts,js,py}"
```

Read critical files completely:
- Core algorithm implementations
- State management logic
- API integration code
- Data transformation pipelines

## Phase 2: Historical Analysis

### Step 5: Git History Exploration

**Get the full timeline:**
```bash
# All commits for the project/folder
git log --all --date=short --pretty=format:"%h | %ad | %s" -- path/to/project/

# With file change stats
git log --all --date=short --stat --pretty=format:"%n=== %h | %ad | %s ===" -- path/to/project/

# Find first commit that created the folder
git log --all --diff-filter=A --date=short --pretty=format:"%h | %ad | %s" -- path/to/project/ | tail -5
```

**Understand each major commit:**
```bash
# Show what changed in a commit
git show <commit-hash> --stat

# See the actual changes
git show <commit-hash> -- path/to/specific/file
```

**Identify development phases:**
- Initial creation commit
- Major refactors (large insertions/deletions)
- Feature additions (new files)
- Architectural changes (file renames, deletions)
- Bug fixes and refinements (small changes)

### Step 6: Evolution Patterns

Look for:
- **Technology migrations**: Library changes, framework upgrades
- **Architecture shifts**: Monolith → microservices, REST → GraphQL
- **Feature expansion**: What was added over time?
- **Simplifications**: What was removed or refactored?

**Timeline markers:**
```bash
# Commits by date with line counts
git log --all --shortstat --pretty=format:"%h | %ad | %s" --date=short -- path/to/project/
```

## Phase 3: Mind Map Construction

### Step 7: Node Planning

Create a hierarchical outline before writing:

**Level 1: Foundation (Nodes 1-5)**
- [1] Project Overview - What, why, high-level architecture
- [2] Core Theory/Concept - Fundamental principles or domain theory
- [3] Data Flow - How information moves through the system
- [4] Frontend/UI Architecture - User-facing components
- [5] Backend/Services Architecture - Server-side logic

**Level 2: Systems (Nodes 6-15)**
- [6-10] Major subsystems (e.g., data schema, algorithms, file management, validation, AI integration)
- [11-15] Key features and components

**Level 3: Implementation (Nodes 16-20)**
- [16] Technology stack details
- [17] Historical context/migrations
- [18] Development workflow
- [19] Future roadmap/TODOs
- [20] Design principles

**Level 4: Deep Dives (Nodes 21-25+)**
- [21+] Specialized topics (specific algorithms, optimization, interpretation, error handling, performance)
- [N] Development history with commit details

### Step 8: Writing Nodes

For each node:

1. **Start with a clear title**: Noun phrase that names the concept
2. **Opening sentence**: Define what this node is about, link to parent concepts [1][2]
3. **Core content**: Explain the concept with specific details
4. **Implementation details**: Code structure, file locations, key functions
5. **Link to related nodes**: Embed [N] references naturally throughout
6. **Technical specifics**: Parameters, configurations, examples

**Writing style:**
- Dense but readable - every sentence should add information
- Use specific examples: "The PCAVisualizer class in pcaVisualizer.ts" not "the visualizer"
- Include numbers: "5-10 features", "23,000+ lines", "700 ticks"
- Reference actual filenames, function names, variable names
- Explain WHY decisions were made, not just WHAT exists

### Step 9: Link Weaving

After drafting all nodes:

1. **Identify connections**: Which nodes discuss related concepts?
2. **Add forward and backward links**: If [5] mentions [12], make sure [12] mentions [5]
3. **Create knowledge clusters**: Groups of highly interconnected nodes (e.g., all visualization nodes link to each other)
4. **Build progressive paths**: [1]→[2]→[7]→[8] should form a coherent learning path
5. **Verify link accuracy**: Every [N] reference should point to a relevant node

**Link density guidelines:**
- Overview nodes: 5-10 links to major subsystems
- System nodes: 3-7 links to related systems and implementation details
- Implementation nodes: 2-5 links to parent systems and related details
- Specialized nodes: 2-4 links to closely related concepts

### Step 10: Historical Node Integration

The history node should:

1. **List all major commits chronologically** with hashes
2. **Explain what each commit did** (files changed, features added)
3. **Show line count changes** for context on commit size
4. **Identify development phases** (prototype, rewrite, refinement, migration)
5. **Connect to other nodes** - link commits to the features they introduced

**Template:**
```markdown
[N] **Development History** - The project evolved over X days/months from DATE to DATE [parent-nodes]. 
Commit HASH (DATE) created the initial folder with FILE1, FILE2, and X features [feature-nodes]. 
Commit HASH (DATE) was the massive rewrite with N insertions creating SYSTEM1 [node], SYSTEM2 [node], 
and SYSTEM3 [node]. Commit HASH (DATE) added FEATURE [node] with N insertions. ... 
Total development: X commits, ~N lines of code, transforming from STATE1 to STATE2 [principle-nodes].
```

## Quality Checklist

### Completeness:
- [ ] All major systems/features have nodes
- [ ] Technology stack is documented
- [ ] Data flow is explained
- [ ] Every significant file/component is mentioned
- [ ] Development history is captured with commit hashes
- [ ] Future directions are noted

### Interconnectedness:
- [ ] Every node has 2+ links
- [ ] Important nodes have 5+ links
- [ ] Links are embedded naturally in text
- [ ] Bidirectional links exist where appropriate
- [ ] Node clusters form around major concepts

### Clarity:
- [ ] Each node has a clear, specific title
- [ ] First sentence defines the concept
- [ ] Technical terms are explained or linked
- [ ] Code examples use actual file/function names
- [ ] Node length is moderate (not too short, not overwhelming)

### Accuracy:
- [ ] All file paths are correct
- [ ] Function/class names match the code
- [ ] Numbers and metrics are accurate
- [ ] Commit hashes are verified
- [ ] Links point to relevant nodes

## Example Node Structures

### System Architecture Node
```markdown
[N] **System Name** - Brief definition and purpose [parent-node]. The system consists of 
COMPONENT1 which handles TASK1 [detail-node], COMPONENT2 for TASK2 [detail-node], and 
COMPONENT3 managing TASK3 [detail-node]. Implementation resides in path/to/files using 
TECHNOLOGY [tech-node] with KEY_PATTERN design pattern [pattern-node]. The system 
integrates with EXTERNAL_SYSTEM [integration-node] through API_METHOD and processes 
data using ALGORITHM [algorithm-node]. Key parameters include PARAM1 (range, default) 
and PARAM2 (type, purpose) [parameter-node].
```

### Implementation Detail Node
```markdown
[N] **Algorithm/Feature Name** - Technical description [parent-system-node][theory-node]. 
The ClassName in path/to/file.ts implements APPROACH [architecture-node]. The algorithm 
follows these steps: first, STEP1 with DETAILS [step1-node], then STEP2 involving 
COMPUTATION [step2-node], and finally STEP3 producing OUTPUT [step3-node]. Parameters 
include PARAM1 (type, purpose, default) and PARAM2 (range, effect) [parameter-node]. 
Performance characteristics: TIME_COMPLEXITY for typical datasets with SIZE_RANGE 
[performance-node]. The implementation uses LIBRARY for TASK [tech-node].
```

### Historical Node
```markdown
[N] **Development History** - The project evolved over TIMESPAN from DATE1 to DATE2 
[overview-node][architecture-node]. Commit HASH1 (DATE) created the initial structure 
with FRAMEWORK [theory-node], TOOL [tech-node], and N founding ITEMS [item-node]. 
Commit HASH2 (DATE) was the major milestone with N insertions creating SYSTEM1 
[system1-node], SYSTEM2 [system2-node], and SYSTEM3 [system3-node]. Commit HASH3 
(DATE) introduced FEATURE with N insertions [feature-node]. Commit HASH4 (DATE) 
executed the MIGRATION with N insertions [migration-node], implementing NEW_APPROACH 
[approach-node] and documenting the shift in FILE [doc-node]. Total development: 
N commits, ~N lines, transforming from STATE1 to STATE2 [principle-node].
```

## Tools and Commands Reference

### File Exploration
```bash
# Find all files of type
find . -name "*.ts" -not -path "*/node_modules/*"

# Count lines of code
find . -name "*.ts" -not -path "*/node_modules/*" | xargs wc -l

# Search for patterns
grep -r "pattern" --include="*.ts" -n
```

### Git Analysis
```bash
# Commit history for specific path
git log --all --oneline -- path/

# Detailed history with stats
git log --all --stat --date=short --pretty=format:"%h | %ad | %s" -- path/

# See what changed in commit
git show <hash>

# Find when file was created
git log --diff-filter=A --follow -- path/to/file

# Count commits
git log --all --oneline -- path/ | wc -l

# Largest commits
git log --all --shortstat --oneline -- path/ | grep -E "file.*change" | sort -t' ' -k4 -rn | head -10
```

### Code Analysis
```bash
# Find all classes/functions
grep -r "^class\|^function\|^const.*= " --include="*.ts"

# Find imports/dependencies
grep -r "^import" --include="*.ts" | cut -d'"' -f2 | sort -u

# Find all exports
grep -r "^export" --include="*.ts"
```

## Final Tips

1. **Start broad, then drill down**: Overview → Systems → Implementation → Details
2. **Write for future you**: Assume you'll forget everything in 6 months
3. **Include the "why"**: Design decisions, not just features
4. **Link generously**: Better too many links than too few
5. **Update iteratively**: Add nodes as you discover new areas
6. **Test navigation**: Can you follow links to learn any topic?
7. **Capture uncertainty**: Note TODOs or unclear areas
8. **Balance depth and breadth**: Cover everything, deep-dive on key systems

## Success Criteria

A good mind map should enable someone to:
- Understand what the project does (overview nodes)
- Learn how it works (system and implementation nodes)
- Trace any feature from concept to code (following links)
- Understand design decisions (principle and history nodes)
- See how the project evolved (history node)
- Find specific implementations (detailed nodes with file paths)
- Identify areas for contribution (TODO and future nodes)

The mind map becomes a **living index** into the codebase, making onboarding, maintenance, and evolution dramatically easier.

