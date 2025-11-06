import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { savingsGoals } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    // Single record by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        }, { status: 400 });
      }

      const goal = await db.select()
        .from(savingsGoals)
        .where(eq(savingsGoals.id, parseInt(id)))
        .limit(1);

      if (goal.length === 0) {
        return NextResponse.json({ 
          error: 'Savings goal not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(goal[0], { status: 200 });
    }

    // List with userId filter (required)
    if (!userId) {
      return NextResponse.json({ 
        error: 'userId is required for listing savings goals',
        code: 'MISSING_USER_ID' 
      }, { status: 400 });
    }

    if (isNaN(parseInt(userId))) {
      return NextResponse.json({ 
        error: 'Valid userId is required',
        code: 'INVALID_USER_ID' 
      }, { status: 400 });
    }

    const goals = await db.select()
      .from(savingsGoals)
      .where(eq(savingsGoals.userId, parseInt(userId)));

    // Return in expected format
    return NextResponse.json({ goals }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, targetAmount, currentAmount, deadline, icon } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json({ 
        error: 'userId is required',
        code: 'MISSING_USER_ID' 
      }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ 
        error: 'title is required',
        code: 'MISSING_TITLE' 
      }, { status: 400 });
    }

    if (!targetAmount && targetAmount !== 0) {
      return NextResponse.json({ 
        error: 'targetAmount is required',
        code: 'MISSING_TARGET_AMOUNT' 
      }, { status: 400 });
    }

    if (!deadline) {
      return NextResponse.json({ 
        error: 'deadline is required',
        code: 'MISSING_DEADLINE' 
      }, { status: 400 });
    }

    // Validate targetAmount is positive
    if (typeof targetAmount !== 'number' || targetAmount <= 0) {
      return NextResponse.json({ 
        error: 'targetAmount must be a positive number',
        code: 'INVALID_TARGET_AMOUNT' 
      }, { status: 400 });
    }

    // Validate userId is a valid integer
    if (isNaN(parseInt(userId.toString()))) {
      return NextResponse.json({ 
        error: 'Valid userId is required',
        code: 'INVALID_USER_ID' 
      }, { status: 400 });
    }

    // Prepare insert data
    const now = new Date().toISOString();
    const insertData: any = {
      userId: parseInt(userId.toString()),
      title: title.trim(),
      targetAmount,
      currentAmount: currentAmount !== undefined ? currentAmount : 0,
      deadline,
      createdAt: now,
      updatedAt: now
    };

    if (icon !== undefined && icon !== null) {
      insertData.icon = icon;
    }

    const newGoal = await db.insert(savingsGoals)
      .values(insertData)
      .returning();

    return NextResponse.json(newGoal[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    // Check if record exists
    const existing = await db.select()
      .from(savingsGoals)
      .where(eq(savingsGoals.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Savings goal not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const { title, targetAmount, currentAmount, deadline, icon } = body;

    // Validate targetAmount if provided
    if (targetAmount !== undefined && (typeof targetAmount !== 'number' || targetAmount <= 0)) {
      return NextResponse.json({ 
        error: 'targetAmount must be a positive number',
        code: 'INVALID_TARGET_AMOUNT' 
      }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (title !== undefined) {
      updateData.title = title.trim();
    }

    if (targetAmount !== undefined) {
      updateData.targetAmount = targetAmount;
    }

    if (currentAmount !== undefined) {
      updateData.currentAmount = currentAmount;
    }

    if (deadline !== undefined) {
      updateData.deadline = deadline;
    }

    if (icon !== undefined) {
      updateData.icon = icon;
    }

    const updated = await db.update(savingsGoals)
      .set(updateData)
      .where(eq(savingsGoals.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    // Check if record exists
    const existing = await db.select()
      .from(savingsGoals)
      .where(eq(savingsGoals.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Savings goal not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const deleted = await db.delete(savingsGoals)
      .where(eq(savingsGoals.id, parseInt(id)))
      .returning();

    return NextResponse.json({ 
      message: 'Savings goal deleted successfully',
      goal: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}