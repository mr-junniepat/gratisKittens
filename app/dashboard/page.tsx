import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Eye, Trash2, Settings, User, Bell } from "lucide-react"
import Link from "next/link"
import { apolloClient } from "@/lib/apollo-client"
import { gql } from "@apollo/client"

// GraphQL query for user's ad listings
const GET_USER_ADS = gql`
  query GetUserAds($authorId: ID!) {
    adListings(where: { author: $authorId }) {
      nodes {
        id
        title
        date
        status
        featuredImage {
          node {
            sourceUrl
          }
        }
      }
    }
  }
`

async function getUserAds() {
  try {
    // In a real app, you'd get the user ID from the authenticated user
    const { data } = await apolloClient.query({
      query: GET_USER_ADS,
      variables: { authorId: "1" } // Replace with actual user ID
    })
    return data.adListings.nodes
  } catch (error) {
    console.error('Error fetching user ads:', error)
    return []
  }
}

export default async function DashboardPage() {
  const userAds = await getUserAds()

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Mijn Dashboard</h1>
          <p className="text-muted-foreground">Beheer je advertenties en account</p>
        </div>

        <Tabs defaultValue="ads" className="space-y-6">
          <TabsList>
            <TabsTrigger value="ads">Mijn Advertenties</TabsTrigger>
            <TabsTrigger value="profile">Profiel</TabsTrigger>
            <TabsTrigger value="settings">Instellingen</TabsTrigger>
          </TabsList>

          <TabsContent value="ads" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Mijn Advertenties</h2>
              <Link href="/ads/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nieuwe Advertentie
                </Button>
              </Link>
            </div>

            <div className="grid gap-4">
              {userAds.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-2">Nog geen advertenties</h3>
                      <p className="text-muted-foreground mb-4">
                        Maak je eerste advertentie aan om te beginnen
                      </p>
                      <Link href="/ads/create">
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Eerste Advertentie
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                userAds.map((ad: any) => (
                  <Card key={ad.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {ad.featuredImage && (
                            <img
                              src={ad.featuredImage.node.sourceUrl}
                              alt={ad.title}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          )}
                          <div>
                            <h3 className="font-semibold">{ad.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              Gepubliceerd op {new Date(ad.date).toLocaleDateString('nl-NL')}
                            </p>
                            <Badge variant={ad.status === 'publish' ? 'default' : 'secondary'}>
                              {ad.status === 'publish' ? 'Actief' : 'Inactief'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Profiel Instellingen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Beheer je profiel informatie en voorkeuren
                </p>
                <Button className="mt-4">
                  Profiel Bewerken
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  Account Instellingen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Beheer je account instellingen en notificaties
                </p>
                <Button className="mt-4">
                  Instellingen Bewerken
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  )
}
