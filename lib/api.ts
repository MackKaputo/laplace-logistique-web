export async function fetchUserDeliveries(userId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries/user-deliveries?customer_id=${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return data?.data || []
  } catch (error) {
    console.error("Error fetching user deliveries:", error)
    throw error
  }
}
