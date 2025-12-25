import os
from collections import defaultdict, deque

def topological_sort_dependencies(directory):
    """
    Perform topological sorting on Python file dependencies in a directory.
    Assumes dependencies are identified by `import` statements.
    """
    graph = defaultdict(list)
    in_degree = defaultdict(int)

    print(f"Scanning directory: {directory}")

    # Build the dependency graph
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".py"):  # Only process Python files
                file_path = os.path.join(root, file)
                with open(file_path, 'r') as f:
                    for line in f:
                        line = line.strip()
                        if line.startswith("import ") or line.startswith("from "):
                            parts = line.split()
                            if line.startswith("import "):
                                dependency = parts[1].split('.')[0] + ".py"
                                if dependency not in files:
                                    continue  # Ignore imports of Python standard library modules
                                dependency = dependency + ".py"
                            elif line.startswith("from "):
                                dependency = parts[1].split('.')[0] + ".py"
                                print(f"Dependency found: {dependency} in {file}")
                                if dependency not in files:
                                    continue  # Ignore imports of Python standard library modules
                            graph[dependency].append(file)
                            in_degree[file] += 1
                if file not in in_degree:
                    in_degree[file] = 0

    print(f"Found {len(graph)} dependencies in {len(in_degree)} files.")

    print("Dependency graph:", graph)

    # Perform topological sort
    queue = deque([node for node in in_degree if in_degree[node] == 0])
    sorted_files = []

    while queue:
        current = queue.popleft()
        sorted_files.append(current)
        for neighbor in graph[current]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    print(sorted_files, "sorted files after topological sort")

    # Check for cycles
    if len(sorted_files) != len(in_degree):
        raise ValueError("Cycle detected in file dependencies")

    print(f"Topological sort completed. Sorted {len(sorted_files)} files.")
    return [directory + file for file in sorted_files]

def merge_files(sorted_files, output_file):
    """
    Merge the sorted Python files into a single file, removing duplicate imports
    and imports related to the merged files themselves.
    """
    seen_imports = set()
    merged_files = {os.path.basename(file).replace('.py', '') for file in sorted_files}
    
    with open(output_file, 'w') as outfile:
        for file in sorted_files:
            with open(file, 'r') as infile:
                for line in infile:
                    stripped_line = line.strip()
                    if stripped_line.startswith("import ") or stripped_line.startswith("from "):
                        # Check if the import is related to the merged files
                        parts = stripped_line.split()
                        if stripped_line.startswith("import "):
                            module = parts[1].split('.')[0]
                        elif stripped_line.startswith("from "):
                            module = parts[1].split('.')[0]
                        
                        if module in merged_files:
                            continue  # Skip imports related to the merged files

                        if stripped_line not in seen_imports:
                            seen_imports.add(stripped_line)
                            outfile.write(line)
                    else:
                        outfile.write(line)



def build(directory, output_file):
    """
    Build the project by sorting dependencies and merging files.
    """
    sorted_files = topological_sort_dependencies(directory)
    merge_files(sorted_files, output_file)
    print(f"Build complete. Output written to {output_file}")

    # try running the merged file
    try:
        exec(open(output_file).read())
    except Exception as e:
        print(f"Error executing merged file: {e}")

def main():
    directory = "./src/"  # Directory containing Python files
    output_file = "api/build/main.build.py"  # Output file for merged code
    build(directory, output_file)


if __name__ == "__main__":
    main()