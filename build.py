import os
import ast
from collections import defaultdict, deque


def topological_sort_dependencies(directory):
    """
    Perform topological sorting on Python file dependencies using AST.
    """
    graph = defaultdict(list)
    in_degree = defaultdict(int)
    all_files = {}  # Map of module name to file path

    print(f"Scanning directory: {directory}")

    # First pass: collect all Python files and their module names
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".py") and file != "__init__.py":
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, directory)
                module_name = file.replace(".py", "")
                all_files[module_name] = rel_path
                in_degree[rel_path] = 0

    print(f"Found {len(all_files)} Python files: {list(all_files.keys())}")

    # Second pass: build the dependency graph using AST
    for module_name, rel_path in all_files.items():
        file_path = os.path.join(directory, rel_path)

        with open(file_path, "r", encoding="utf-8") as f:
            try:
                tree = ast.parse(f.read(), filename=file_path)

                for node in ast.walk(tree):
                    # Check for "from src.X import ..." statements
                    if isinstance(node, ast.ImportFrom):
                        if node.module and node.module.startswith("src."):
                            imported_module = node.module.split(".", 1)[1]
                            if imported_module in all_files:
                                dependency_path = all_files[imported_module]
                                print(f"{module_name} depends on {imported_module}")
                                graph[dependency_path].append(rel_path)
                                in_degree[rel_path] += 1

                    # Check for "import src.X" statements
                    elif isinstance(node, ast.Import):
                        for alias in node.names:
                            if alias.name.startswith("src."):
                                imported_module = alias.name.split(".", 1)[1]
                                if imported_module in all_files:
                                    dependency_path = all_files[imported_module]
                                    print(f"{module_name} depends on {imported_module}")
                                    graph[dependency_path].append(rel_path)
                                    in_degree[rel_path] += 1
            except SyntaxError as e:
                print(f"Syntax error in {file_path}: {e}")
                continue

    print(f"Dependency graph built with {len(graph)} dependencies")
    print("In-degrees:", {k: v for k, v in in_degree.items()})

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

    print(f"Sorted files: {sorted_files}")

    # Check for cycles
    if len(sorted_files) != len(in_degree):
        remaining = [f for f in in_degree if f not in sorted_files]
        print(f"Cycle detected! Remaining files: {remaining}")
        raise ValueError("Cycle detected in file dependencies")

    print(f"Topological sort completed. Sorted {len(sorted_files)} files.")
    return [os.path.join(directory, file) for file in sorted_files]


def merge_files(sorted_files, output_file):
    """
    Merge the sorted Python files into a single file using AST.
    All top-level imports are collected, deduplicated, and placed at the top.
    Internal imports (from src.*) are removed since files are being merged.
    Imports from the same module are combined (e.g., "from x import a, b").
    Imports are organized according to PEP8: stdlib, third-party, local.
    """
    import sys
    from importlib.util import find_spec

    merged_modules = {
        os.path.basename(file).replace(".py", "") for file in sorted_files
    }

    # Separate imports by category: stdlib, third-party, local
    stdlib_import_from = defaultdict(set)
    stdlib_imports = []
    thirdparty_import_from = defaultdict(set)
    thirdparty_imports = []

    seen_stdlib_imports = set()
    seen_thirdparty_imports = set()

    file_contents = []  # List of (filename, non-import content)

    print(f"Merging {len(sorted_files)} files into {output_file}")
    print(f"Merged modules: {merged_modules}")

    def is_stdlib(module_name):
        """Check if a module is from the standard library."""
        if module_name in sys.builtin_module_names:
            return True
        try:
            spec = find_spec(module_name.split(".")[0])
            if spec is None:
                return False
            origin = spec.origin
            if origin and "site-packages" not in origin:
                return True
        except (ImportError, ValueError, AttributeError):
            pass
        return False

    # Process each file using AST
    for file in sorted_files:
        print(f"Processing {file}")

        with open(file, "r", encoding="utf-8") as infile:
            source = infile.read()

        try:
            tree = ast.parse(source, filename=file)

            # Separate top-level imports from other code
            other_nodes = []

            for node in tree.body:
                if isinstance(node, (ast.Import, ast.ImportFrom)):
                    # Check if it's an internal import (from src.*)
                    is_internal = False

                    if isinstance(node, ast.ImportFrom):
                        if node.module and node.module.startswith("src."):
                            imported_module = node.module.split(".", 1)[1]
                            if imported_module in merged_modules:
                                print(
                                    f"  Skipping internal import: from {node.module} import ..."
                                )
                                is_internal = True

                        if not is_internal and node.module:
                            # Collect all imported names from this module
                            module_is_stdlib = is_stdlib(node.module)
                            target_dict = (
                                stdlib_import_from
                                if module_is_stdlib
                                else thirdparty_import_from
                            )

                            for alias in node.names:
                                name = alias.name
                                asname = alias.asname
                                import_key = f"{name} as {asname}" if asname else name
                                target_dict[node.module].add(import_key)
                                print(
                                    f"  Collected: from {node.module} import {import_key} ({'stdlib' if module_is_stdlib else 'third-party'})"
                                )

                    elif isinstance(node, ast.Import):
                        # Check for internal imports
                        for alias in node.names:
                            if alias.name.startswith("src."):
                                imported_module = alias.name.split(".", 1)[1]
                                if imported_module in merged_modules:
                                    print(
                                        f"  Skipping internal import: import {alias.name}"
                                    )
                                    is_internal = True
                                    break

                        if not is_internal:
                            # Regular "import X" statement
                            for alias in node.names:
                                module_is_stdlib = is_stdlib(alias.name)
                                import_key = (
                                    f"{alias.name} as {alias.asname}"
                                    if alias.asname
                                    else alias.name
                                )

                                if module_is_stdlib:
                                    if import_key not in seen_stdlib_imports:
                                        stdlib_imports.append(f"import {import_key}")
                                        seen_stdlib_imports.add(import_key)
                                        print(
                                            f"  Collected: import {import_key} (stdlib)"
                                        )
                                else:
                                    if import_key not in seen_thirdparty_imports:
                                        thirdparty_imports.append(
                                            f"import {import_key}"
                                        )
                                        seen_thirdparty_imports.add(import_key)
                                        print(
                                            f"  Collected: import {import_key} (third-party)"
                                        )
                else:
                    other_nodes.append(node)

            # Convert non-import nodes back to source
            if other_nodes:
                # Get the source segments for all non-import nodes
                # We need to extract with decorators, so use line ranges
                source_lines = source.splitlines(keepends=True)
                non_import_source = []

                for node in other_nodes:
                    # Get the start line (accounting for decorators for functions/classes)
                    if hasattr(node, "decorator_list") and node.decorator_list:
                        start_line = node.decorator_list[0].lineno - 1
                    else:
                        start_line = node.lineno - 1

                    end_line = node.end_lineno

                    # Extract lines from source
                    segment_lines = source_lines[start_line:end_line]
                    segment = "".join(segment_lines)
                    if segment:
                        non_import_source.append(segment)

                file_contents.append(
                    (os.path.basename(file), "\n\n".join(non_import_source))
                )

        except SyntaxError as e:
            print(f"Syntax error in {file}: {e}")
            # Fallback: include the file as-is
            file_contents.append((os.path.basename(file), source))

    # Write merged file with imports at the top
    with open(output_file, "w", encoding="utf-8") as outfile:
        # Write warning header
        outfile.write("""# ============================================================================
# WARNING: This file is AUTO-GENERATED by build.py
# DO NOT EDIT THIS FILE MANUALLY!
# 
# Any changes made to this file will be lost when build.py runs again.
# To make changes, edit the source files in the src/ directory instead.
# 
# Generated from: db.py, schemas.py, models.py, main.py
# ============================================================================

""")

        # Write all imports at the top
        outfile.write("# ===== All Imports =====\n")

        # Standard library imports
        if stdlib_imports or stdlib_import_from:
            # Write "import X" statements first
            for import_stmt in sorted(stdlib_imports):
                outfile.write(f"{import_stmt}\n")

            # Write "from X import Y" statements
            for module in sorted(stdlib_import_from.keys()):
                names = stdlib_import_from[module]
                sorted_names = sorted(names)
                names_str = ", ".join(sorted_names)
                outfile.write(f"from {module} import {names_str}\n")

            outfile.write("\n")  # Blank line after stdlib

        # Third-party imports
        if thirdparty_imports or thirdparty_import_from:
            # Write "import X" statements first
            for import_stmt in sorted(thirdparty_imports):
                outfile.write(f"{import_stmt}\n")

            # Write "from X import Y" statements
            for module in sorted(thirdparty_import_from.keys()):
                names = thirdparty_import_from[module]
                sorted_names = sorted(names)
                names_str = ", ".join(sorted_names)
                outfile.write(f"from {module} import {names_str}\n")

        outfile.write("\n")

        # Write all non-import content from each file
        for filename, content in file_contents:
            outfile.write(f"\n# ===== From {filename} =====\n")
            outfile.write(content)
            outfile.write("\n\n")


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
    output_file = "frontend/api/build/main.build.py"  # Output file for merged code
    build(directory, output_file)


if __name__ == "__main__":
    main()
