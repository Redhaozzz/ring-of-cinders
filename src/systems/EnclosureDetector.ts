export interface GridPosition {
  x: number
  y: number
}

export interface EnclosureResult {
  hasEnclosure: boolean
  enclosedCells: GridPosition[]
  enclosureBoundary: GridPosition[]
}

export class EnclosureDetector {
  private gridWidth: number
  private gridHeight: number
  private cellSize: number

  constructor(gameWidth: number, gameHeight: number, cellSize: number = 32) {
    this.cellSize = cellSize
    this.gridWidth = Math.ceil(gameWidth / cellSize)
    this.gridHeight = Math.ceil(gameHeight / cellSize)
  }

  /**
   * Convert world coordinates to grid coordinates
   */
  private worldToGrid(worldX: number, worldY: number): GridPosition {
    return {
      x: Math.floor(worldX / this.cellSize),
      y: Math.floor(worldY / this.cellSize)
    }
  }

  /**
   * Convert grid coordinates to world coordinates (center of cell)
   */
  private gridToWorld(gridX: number, gridY: number): GridPosition {
    return {
      x: gridX * this.cellSize + this.cellSize / 2,
      y: gridY * this.cellSize + this.cellSize / 2
    }
  }

  /**
   * Check if grid position is within bounds
   */
  private isValidGridPosition(x: number, y: number): boolean {
    return x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight
  }

  /**
   * Get unique key for grid position
   */
  private getPositionKey(x: number, y: number): string {
    return `${x},${y}`
  }

  /**
   * Detect enclosures using flood fill algorithm from boundaries
   * Returns the enclosed areas and the boundary cells that form the enclosure
   */
  detectEnclosures(brickPositions: GridPosition[]): EnclosureResult {
    // Create a set of occupied grid cells
    const occupiedCells = new Set<string>()

    // Convert brick world positions to grid positions
    for (const brick of brickPositions) {
      const gridPos = this.worldToGrid(brick.x, brick.y)
      if (this.isValidGridPosition(gridPos.x, gridPos.y)) {
        occupiedCells.add(this.getPositionKey(gridPos.x, gridPos.y))
      }
    }

    // Track visited cells during flood fill
    const visited = new Set<string>()
    const reachableFromBoundary = new Set<string>()

    // Flood fill from all boundary cells
    const queue: GridPosition[] = []

    // Add all boundary cells to queue
    // Top and bottom edges
    for (let x = 0; x < this.gridWidth; x++) {
      if (!occupiedCells.has(this.getPositionKey(x, 0))) {
        queue.push({ x, y: 0 })
        visited.add(this.getPositionKey(x, 0))
      }
      if (!occupiedCells.has(this.getPositionKey(x, this.gridHeight - 1))) {
        queue.push({ x, y: this.gridHeight - 1 })
        visited.add(this.getPositionKey(x, this.gridHeight - 1))
      }
    }

    // Left and right edges
    for (let y = 1; y < this.gridHeight - 1; y++) {
      if (!occupiedCells.has(this.getPositionKey(0, y))) {
        queue.push({ x: 0, y })
        visited.add(this.getPositionKey(0, y))
      }
      if (!occupiedCells.has(this.getPositionKey(this.gridWidth - 1, y))) {
        queue.push({ x: this.gridWidth - 1, y })
        visited.add(this.getPositionKey(this.gridWidth - 1, y))
      }
    }

    // BFS flood fill from boundary
    const directions = [
      { x: 0, y: -1 }, // up
      { x: 0, y: 1 },  // down
      { x: -1, y: 0 }, // left
      { x: 1, y: 0 }   // right
    ]

    while (queue.length > 0) {
      const current = queue.shift()!
      reachableFromBoundary.add(this.getPositionKey(current.x, current.y))

      // Check all 4 directions
      for (const dir of directions) {
        const newX = current.x + dir.x
        const newY = current.y + dir.y
        const posKey = this.getPositionKey(newX, newY)

        // Skip if out of bounds, already visited, or occupied by brick
        if (!this.isValidGridPosition(newX, newY) ||
            visited.has(posKey) ||
            occupiedCells.has(posKey)) {
          continue
        }

        visited.add(posKey)
        queue.push({ x: newX, y: newY })
      }
    }

    // Find enclosed cells (cells not reachable from boundary and not occupied)
    const enclosedCells: GridPosition[] = []

    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const posKey = this.getPositionKey(x, y)

        if (!occupiedCells.has(posKey) && !reachableFromBoundary.has(posKey)) {
          // Convert back to world coordinates for easier use
          const worldPos = this.gridToWorld(x, y)
          enclosedCells.push(worldPos)
        }
      }
    }

    // Find boundary bricks that form the enclosure
    const enclosureBoundary: GridPosition[] = []

    if (enclosedCells.length > 0) {
      // A brick is part of the enclosure boundary if it's adjacent to an enclosed cell
      for (const brick of brickPositions) {
        const gridPos = this.worldToGrid(brick.x, brick.y)

        // Check if this brick is adjacent to any enclosed cell
        for (const dir of directions) {
          const checkX = gridPos.x + dir.x
          const checkY = gridPos.y + dir.y
          const checkKey = this.getPositionKey(checkX, checkY)

          if (this.isValidGridPosition(checkX, checkY) &&
              !occupiedCells.has(checkKey) &&
              !reachableFromBoundary.has(checkKey)) {
            enclosureBoundary.push(brick)
            break // Only add the brick once
          }
        }
      }
    }

    return {
      hasEnclosure: enclosedCells.length > 0,
      enclosedCells,
      enclosureBoundary
    }
  }

  /**
   * Get grid dimensions for debugging
   */
  getGridDimensions(): { width: number, height: number, cellSize: number } {
    return {
      width: this.gridWidth,
      height: this.gridHeight,
      cellSize: this.cellSize
    }
  }
}