
run:
	@echo "Starting development server..."
	@pnpm run dev

build:
	@echo "Building project..."
	@pnpm run build

clean:
	@echo "Cleaning build files..."
	@rm -rf dist

install:
	@echo "Installing dependencies..."
	@pnpm install：