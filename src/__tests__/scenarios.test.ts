import { describe, it, expect } from "vitest";
import { s, Schema } from "../index.js";

describe("20 Scenarios", () => {
  it("Scenario 1: E-commerce Product", async () => {
    const productSchema = s.object({
      validate: {
        properties: {
          id: s.string({ validate: { cuid: true } }),
          name: s.string({ validate: { minLength: 3 } }),
          price: s.number({ validate: { positive: true } }),
          dimensions: s.object({
            validate: {
              properties: {
                width: s.number({ validate: { positive: true } }),
                height: s.number({ validate: { positive: true } }),
                depth: s.number({ validate: { positive: true } }),
              },
            },
          }),
          tags: s.array(s.string()),
          warehouseStock: s.record(s.string(), s.boolean()),
        },
      },
    });

    const validProduct = {
      id: "clgq0g2h2000008kygim3a3e4",
      name: "Wireless Headphones",
      price: 99.99,
      dimensions: {
        width: 8.5,
        height: 7.0,
        depth: 3.5,
      },
      tags: ["audio", "wireless", "over-ear"],
      warehouseStock: {
        "wh-1": true,
        "wh-2": false,
      },
    };

    await expect(productSchema.parse(validProduct)).resolves.toEqual(
      validProduct
    );

    const invalidProduct = { ...validProduct, price: -10 };
    await expect(productSchema.safeParse(invalidProduct)).resolves.toEqual(
      expect.objectContaining({ status: "error" })
    );
  });

  it("Scenario 2: User Profile", async () => {
    const userProfileSchema = s.object({
      validate: {
        properties: {
          username: s.string({
            prepare: { trim: true },
            validate: { pattern: /^[a-zA-Z0-9_]+$/ },
          }),
          email: s.string({ validate: { email: true } }),
          bio: s.string({ optional: true }),
          socialLinks: s.array(
            s.object({
              validate: {
                properties: {
                  platform: s.string(),
                  url: s.string({ validate: { url: true } }),
                },
              },
            })
          ),
          settings: s.object({
            validate: {
              properties: {
                emailNotifications: s.boolean({ prepare: { coerce: true } }),
                darkMode: s.boolean(),
              },
            },
          }),
        },
      },
    });

    const validProfile = {
      username: "test_user ",
      email: "test@example.com",
      socialLinks: [
        { platform: "twitter", url: "https://twitter.com/test_user" },
      ],
      settings: {
        emailNotifications: "true",
        darkMode: false,
      },
    };

    const expectedProfile = {
      username: "test_user",
      email: "test@example.com",
      socialLinks: [
        { platform: "twitter", url: "https://twitter.com/test_user" },
      ],
      settings: {
        emailNotifications: true,
        darkMode: false,
      },
    };

    await expect(userProfileSchema.parse(validProfile)).resolves.toEqual(
      expectedProfile
    );

    const invalidProfile = { ...validProfile, email: "not-an-email" };
    await expect(userProfileSchema.safeParse(invalidProfile)).resolves.toEqual(
      expect.objectContaining({ status: "error" })
    );
  });

  it("Scenario 3: Blog Post", async () => {
    const blogPostSchema = s.object({
      validate: {
        properties: {
          title: s.string({ validate: { minLength: 1 } }),
          content: s.string(),
          author: s.object({
            validate: {
              properties: {
                name: s.string(),
                email: s.string({ validate: { email: true } }),
              },
            },
          }),
          comments: s.array(
            s.object({
              validate: {
                properties: {
                  commenter: s.string(),
                  text: s.string(),
                  createdAt: s.date({ prepare: { coerce: true } }),
                },
              },
            })
          ),
          publishedAt: s.date({ prepare: { coerce: true }, optional: true }),
        },
      },
    });

    const validPost = {
      title: "My First Post",
      content: "Hello world!",
      author: {
        name: "John Doe",
        email: "john.doe@example.com",
      },
      comments: [
        {
          commenter: "Jane",
          text: "Great post!",
          createdAt: "2023-01-01T12:00:00.000Z",
        },
      ],
      publishedAt: "2023-01-01T11:00:00.000Z",
    };

    const parsedPost = await blogPostSchema.parse(validPost);
    expect(parsedPost.title).toBe("My First Post");
    expect(parsedPost.comments[0].createdAt).toBeInstanceOf(Date);
    expect(parsedPost.publishedAt).toBeInstanceOf(Date);

    const invalidPost = { ...validPost, author: { name: "Missing email" } };
    await expect(blogPostSchema.safeParse(invalidPost)).resolves.toEqual(
      expect.objectContaining({ status: "error" })
    );
  });

  it("Scenario 4: Event Registration", async () => {
    const registrationSchema = s.object({
      validate: {
        properties: {
          fullName: s.string(),
          ticketType: s.union({
            validate: {
              of: [
                s.literal("general"),
                s.literal("vip"),
                s.literal("student"),
              ],
            },
          }),
          addOns: s.array(s.string()).optional(),
          paymentDetails: s.switch({
            select: (ctx) => ctx.value.method,
            cases: {
              credit_card: s.object({
                validate: {
                  properties: {
                    method: s.literal("credit_card"),
                    cardNumber: s.string({ validate: { length: 16 } }),
                    expiry: s.string({
                      validate: { pattern: /^\d{2}\/\d{2}$/ },
                    }),
                  },
                },
              }),
              paypal: s.object({
                validate: {
                  properties: {
                    method: s.literal("paypal"),
                    paypalEmail: s.string({ validate: { email: true } }),
                  },
                },
              }),
            },
            failOnNoMatch: true,
          }),
        },
      },
    });

    const validRegistration = {
      fullName: "Jane Doe",
      ticketType: "vip",
      addOns: ["lunch", "t-shirt"],
      paymentDetails: {
        method: "credit_card",
        cardNumber: "1234567812345678",
        expiry: "12/25",
      },
    };

    await expect(registrationSchema.parse(validRegistration)).resolves.toEqual(
      validRegistration
    );

    const invalidRegistration = { ...validRegistration, ticketType: "staff" };
    await expect(
      registrationSchema.safeParse(invalidRegistration)
    ).resolves.toEqual(expect.objectContaining({ status: "error" }));
  });

  it("Scenario 5: Application Configuration", async () => {
    const configSchema = s.object({
      validate: {
        properties: {
          port: s.number({
            prepare: { coerce: true },
            validate: { integer: true, min: 1024, max: 65535 },
          }),
          loggingLevel: s.string({
            validate: { oneOf: ["debug", "info", "warn", "error"] },
          }),
          features: s.object({
            validate: {
              properties: {
                enableAnalytics: s.boolean(),
                enableTwoFactorAuth: s.boolean(),
              },
            },
          }),
          plugins: s.array(
            s.object({
              validate: {
                properties: {
                  name: s.string(),
                  enabled: s.boolean(),
                  config: s.record(s.string(), s.any()).optional(),
                },
              },
            })
          ),
        },
      },
    });

    const validConfig = {
      port: "8080",
      loggingLevel: "info",
      features: {
        enableAnalytics: true,
        enableTwoFactorAuth: false,
      },
      plugins: [
        { name: "cors", enabled: true },
        {
          name: "rate-limit",
          enabled: true,
          config: { requests: 100, per: "minute" },
        },
      ],
    };

    const result = await configSchema.parse(validConfig);
    expect(result.port).toBe(8080);
    expect(result.loggingLevel).toBe("info");

    const invalidConfig = { ...validConfig, port: 999 };
    await expect(configSchema.safeParse(invalidConfig)).resolves.toEqual(
      expect.objectContaining({ status: "error" })
    );
  });

  it("Scenario 6: Movie Database API Response", async () => {
    const movieSchema = s.object({
      validate: {
        properties: {
          title: s.string(),
          releaseYear: s.number({ validate: { integer: true } }),
          actors: s.array(
            s.object({
              validate: {
                properties: {
                  name: s.string(),
                  role: s.string(),
                },
              },
            })
          ),
          director: s.object({
            validate: { properties: { name: s.string() } },
          }),
          ratings: s.map(
            s.string(),
            s.number({ validate: { min: 0, max: 10 } })
          ),
        },
      },
    });

    const validMovie = {
      title: "The Matrix",
      releaseYear: 1999,
      actors: [
        { name: "Keanu Reeves", role: "Neo" },
        { name: "Laurence Fishburne", role: "Morpheus" },
      ],
      director: { name: "The Wachowskis" },
      ratings: new Map([
        ["imdb", 8.7],
        ["rotten_tomatoes", 8.8],
      ]),
    };

    await expect(movieSchema.parse(validMovie)).resolves.toEqual(validMovie);

    const invalidMovie = {
      ...validMovie,
      ratings: new Map([["imdb", 11]]),
    }; // rating > 10
    await expect(movieSchema.safeParse(invalidMovie)).resolves.toEqual(
      expect.objectContaining({ status: "error" })
    );
  });

  it("Scenario 7: Dynamic Survey Form", async () => {
    const questionSchema = s.switch({
      select: (ctx) => ctx.value.type,
      cases: {
        text: s.object({
          validate: {
            properties: {
              type: s.literal("text"),
              label: s.string(),
            },
          },
        }),
        multiple_choice: s.object({
          validate: {
            properties: {
              type: s.literal("multiple_choice"),
              label: s.string(),
              options: s.array(s.string()),
            },
          },
        }),
        rating: s.object({
          validate: {
            properties: {
              type: s.literal("rating"),
              label: s.string(),
              max: s.number({ validate: { integer: true, min: 3, max: 10 } }),
            },
          },
        }),
      },
    });

    const surveySchema = s.object({
      validate: {
        properties: {
          title: s.string(),
          questions: s.array(questionSchema),
        },
      },
    });

    const validSurvey = {
      title: "Customer Feedback",
      questions: [
        { type: "text", label: "Any comments?" },
        {
          type: "multiple_choice",
          label: "How did you hear about us?",
          options: ["Social Media", "Friend", "Advertisement"],
        },
        { type: "rating", label: "How would you rate our service?", max: 5 },
      ],
    };

    await expect(surveySchema.parse(validSurvey)).resolves.toEqual(validSurvey);

    const invalidSurvey = {
      ...validSurvey,
      questions: [{ type: "rating", label: "Invalid rating", max: 11 }],
    };
    await expect(surveySchema.safeParse(invalidSurvey)).resolves.toEqual(
      expect.objectContaining({ status: "error" })
    );
  });

  it("Scenario 8: Recipe Card", async () => {
    const recipeSchema = s.object({
      validate: {
        properties: {
          name: s.string(),
          ingredients: s.array(
            s.object({
              validate: {
                properties: {
                  name: s.string(),
                  quantity: s.number(),
                  unit: s.string().optional(),
                },
              },
            })
          ),
          instructions: s.array(s.string()),
          prepTime: s.number({ validate: { positive: true } }),
          cookTime: s.number({ validate: { positive: true } }),
        },
      },
    });

    const validRecipe = {
      name: "Spaghetti Carbonara",
      ingredients: [
        { name: "Spaghetti", quantity: 200, unit: "g" },
        { name: "Guanciale", quantity: 100, unit: "g" },
        { name: "Eggs", quantity: 2 },
        { name: "Pecorino Romano", quantity: 50, unit: "g" },
      ],
      instructions: [
        "Cook spaghetti.",
        "Fry guanciale.",
        "Mix eggs and cheese.",
        "Combine everything.",
      ],
      prepTime: 10,
      cookTime: 15,
    };

    await expect(recipeSchema.parse(validRecipe)).resolves.toEqual(validRecipe);

    const invalidRecipe = { ...validRecipe, prepTime: -5 };
    await expect(recipeSchema.safeParse(invalidRecipe)).resolves.toEqual(
      expect.objectContaining({ status: "error" })
    );
  });

  it("Scenario 9: Real Estate Listing", async () => {
    const listingSchema = s.object({
      validate: {
        properties: {
          address: s.object({
            validate: {
              properties: {
                street: s.string(),
                city: s.string(),
                zipCode: s.string({ validate: { pattern: /^\d{5}$/ } }),
              },
            },
          }),
          price: s.number({ validate: { gte: 0 } }),
          bedrooms: s.number({ validate: { integer: true, gte: 1 } }),
          bathrooms: s.number({ validate: { gte: 1 } }),
          imageUrls: s.array(s.string({ validate: { url: true } })),
          contact: s.object({
            validate: {
              properties: {
                name: s.string(),
                phone: s.string(),
              },
            },
          }),
        },
      },
    });

    const validListing = {
      address: {
        street: "123 Main St",
        city: "Anytown",
        zipCode: "12345",
      },
      price: 250000,
      bedrooms: 3,
      bathrooms: 2.5,
      imageUrls: ["https://example.com/image1.jpg"],
      contact: {
        name: "John Realtor",
        phone: "555-123-4567",
      },
    };

    await expect(listingSchema.parse(validListing)).resolves.toEqual(
      validListing
    );

    const invalidListing = { ...validListing, bedrooms: 0 };
    await expect(listingSchema.safeParse(invalidListing)).resolves.toEqual(
      expect.objectContaining({ status: "error" })
    );
  });

  it("Scenario 10: Healthcare Patient Record", async () => {
    const patientRecordSchema = s.object({
      validate: {
        properties: {
          patientId: s.string({ validate: { uuid: true } }),
          personalDetails: s.object({
            validate: {
              properties: {
                firstName: s.string(),
                lastName: s.string(),
                dob: s.date({ prepare: { coerce: true } }),
              },
            },
          }),
          visits: s.array(
            s.object({
              validate: {
                properties: {
                  date: s.date({ prepare: { coerce: true } }),
                  reason: s.string(),
                  notes: s.string().optional(),
                },
              },
            })
          ),
          allergies: s.record(s.string(), s.string()),
        },
      },
    });

    const validRecord = {
      patientId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      personalDetails: {
        firstName: "Jane",
        lastName: "Doe",
        dob: "1980-05-15",
      },
      visits: [
        {
          date: "2023-01-20",
          reason: "Annual check-up",
          notes: "All good.",
        },
      ],
      allergies: {
        pollen: "mild",
        peanuts: "severe",
      },
    };

    const result = await patientRecordSchema.parse(validRecord);
    expect(result.personalDetails.dob).toBeInstanceOf(Date);

    const invalidRecord = { ...validRecord, patientId: "not-a-uuid" };
    await expect(patientRecordSchema.safeParse(invalidRecord)).resolves.toEqual(
      expect.objectContaining({ status: "error" })
    );
  });

  it("Scenario 11: Music Playlist", async () => {
    const playlistSchema = s.object({
      validate: {
        properties: {
          name: s.string(),
          creator: s.string(),
          tracks: s.array(
            s.object({
              validate: {
                properties: {
                  title: s.string(),
                  artist: s.string(),
                  duration: s.number({ validate: { positive: true } }),
                  album: s
                    .object({
                      validate: {
                        properties: {
                          title: s.string(),
                          releaseYear: s.number().optional(),
                        },
                      },
                    })
                    .optional(),
                },
              },
            })
          ),
        },
      },
    });

    const validPlaylist = {
      name: "Chill Vibes",
      creator: "DJ Relax",
      tracks: [
        { title: "Sunrise", artist: "Lofi Girl", duration: 180 },
        {
          title: "Moonlight",
          artist: "Chillhop",
          duration: 210,
          album: { title: "The Chillhop Essentials" },
        },
      ],
    };

    await expect(playlistSchema.parse(validPlaylist)).resolves.toEqual(
      validPlaylist
    );

    const invalidPlaylist = {
      ...validPlaylist,
      tracks: [{ title: "Broken", artist: "Error", duration: -10 }],
    };
    await expect(playlistSchema.safeParse(invalidPlaylist)).resolves.toEqual(
      expect.objectContaining({ status: "error" })
    );
  });

  it("Scenario 12: Travel Itinerary", async () => {
    const itinerarySchema = s.object({
      validate: {
        properties: {
          destination: s.string(),
          startDate: s.date({ prepare: { coerce: true } }),
          endDate: s.date({ prepare: { coerce: true } }),
          dailyPlans: s.array(
            s.object({
              validate: {
                properties: {
                  day: s.number({ validate: { integer: true, gte: 1 } }),
                  activities: s.array(
                    s.object({
                      validate: {
                        properties: {
                          time: s.string({
                            validate: { pattern: /^\d{2}:\d{2}$/ },
                          }),
                          description: s.string(),
                        },
                      },
                    })
                  ),
                },
              },
            })
          ),
        },
      },
    });

    const validItinerary = {
      destination: "Paris",
      startDate: "2024-08-01",
      endDate: "2024-08-05",
      dailyPlans: [
        {
          day: 1,
          activities: [{ time: "10:00", description: "Visit the Louvre" }],
        },
        {
          day: 2,
          activities: [
            { time: "11:00", description: "Eiffel Tower" },
            { time: "19:00", description: "Dinner Cruise" },
          ],
        },
      ],
    };

    await expect(itinerarySchema.parse(validItinerary)).resolves.toEqual(
      expect.any(Object)
    );

    const invalidItinerary = {
      ...validItinerary,
      dailyPlans: [{ day: 1, activities: [{ time: "10", description: "" }] }],
    };
    await expect(itinerarySchema.safeParse(invalidItinerary)).resolves.toEqual(
      expect.objectContaining({ status: "error" })
    );
  });

  it("Scenario 13: Gaming Character Sheet", async () => {
    const characterSchema = s.object({
      validate: {
        properties: {
          name: s.string(),
          class: s.union({
            validate: {
              of: [s.literal("warrior"), s.literal("mage"), s.literal("rogue")],
            },
          }),
          level: s.number({ validate: { integer: true, gte: 1 } }),
          attributes: s.object({
            validate: {
              properties: {
                strength: s.number({ validate: { integer: true } }),
                dexterity: s.number({ validate: { integer: true } }),
                intelligence: s.number({ validate: { integer: true } }),
              },
            },
          }),
          inventory: s.array(s.string()),
          skills: s.array(
            s.object({
              validate: {
                properties: {
                  name: s.string(),
                  level: s.number({ validate: { integer: true, gte: 1 } }),
                },
              },
            })
          ),
        },
      },
    });

    const validCharacter = {
      name: "Gimli",
      class: "warrior",
      level: 10,
      attributes: {
        strength: 18,
        dexterity: 12,
        intelligence: 8,
      },
      inventory: ["Axe", "Shield", "Rations"],
      skills: [{ name: "Axe Mastery", level: 5 }],
    };

    await expect(characterSchema.parse(validCharacter)).resolves.toEqual(
      validCharacter
    );

    const invalidCharacter = { ...validCharacter, class: "archer" };
    await expect(characterSchema.safeParse(invalidCharacter)).resolves.toEqual(
      expect.objectContaining({ status: "error" })
    );
  });

  it("Scenario 14: CI/CD Pipeline Configuration", async () => {
    const pipelineSchema = s.object({
      validate: {
        properties: {
          name: s.string(),
          trigger: s.object({
            validate: { properties: { on: s.array(s.string()) } },
          }),
          jobs: s.array(
            s.object({
              validate: {
                properties: {
                  name: s.string(),
                  "runs-on": s.string(),
                  steps: s.array(
                    s.object({
                      validate: {
                        properties: {
                          name: s.string(),
                          run: s.string(),
                        },
                      },
                    })
                  ),
                },
              },
            })
          ),
        },
      },
    });

    const validPipeline = {
      name: "My App Build",
      trigger: { on: ["push", "pull_request"] },
      jobs: [
        {
          name: "build",
          "runs-on": "ubuntu-latest",
          steps: [
            { name: "Checkout", run: "actions/checkout@v2" },
            { name: "Install Dependencies", run: "npm install" },
            { name: "Run Tests", run: "npm test" },
          ],
        },
      ],
    };

    await expect(pipelineSchema.parse(validPipeline)).resolves.toEqual(
      validPipeline
    );

    const invalidPipeline = { ...validPipeline, jobs: [{ name: "build" }] };
    await expect(pipelineSchema.safeParse(invalidPipeline)).resolves.toEqual(
      expect.objectContaining({ status: "error" })
    );
  });

  it("Scenario 15: Financial Transaction", async () => {
    const transactionSchema = s.object({
      validate: {
        properties: {
          transactionId: s.string({ validate: { uuidV7: true } }),
          amount: s.number({ validate: { positive: true } }),
          currency: s.string({ validate: { length: 3 } }),
          fromAccount: s.string(),
          toAccount: s.string(),
          timestamp: s.date({ prepare: { coerce: true } }),
        },
      },
    });

    const validTransaction = {
      transactionId: "018f3a3a-79a4-73f1-ba5d-e79435368361",
      amount: 100.5,
      currency: "USD",
      fromAccount: "acc_123",
      toAccount: "acc_456",
      timestamp: new Date().toISOString(),
    };

    const result = await transactionSchema.parse(validTransaction);
    expect(result.timestamp).toBeInstanceOf(Date);

    const invalidTransaction = { ...validTransaction, amount: -50 };
    await expect(
      transactionSchema.safeParse(invalidTransaction)
    ).resolves.toEqual(expect.objectContaining({ status: "error" }));
  });

  it("Scenario 16: Social Media Feed Item", async () => {
    const postSchema = s.object({
      validate: {
        properties: {
          type: s.literal("post"),
          author: s.string(),
          content: s.string(),
        },
      },
    });

    const sharedPostSchema = s.object({
      validate: {
        properties: {
          type: s.literal("shared_post"),
          sharer: s.string(),
          originalPost: postSchema,
        },
      },
    });

    const feedItemSchema = s.union({
      validate: { of: [postSchema, sharedPostSchema] },
    });

    const validPost = {
      type: "post",
      author: "user_a",
      content: "This is my first post!",
    };
    await expect(feedItemSchema.parse(validPost)).resolves.toEqual(validPost);

    const validSharedPost = {
      type: "shared_post",
      sharer: "user_b",
      originalPost: validPost,
    };
    await expect(feedItemSchema.parse(validSharedPost)).resolves.toEqual(
      validSharedPost
    );

    const invalidFeedItem = { type: "comment", text: "A comment" };
    await expect(feedItemSchema.safeParse(invalidFeedItem)).resolves.toEqual(
      expect.objectContaining({ status: "error" })
    );
  });

  it("Scenario 17: Restaurant Menu", async () => {
    const dishSchema = s.object({
      validate: {
        properties: {
          name: s.string(),
          price: s.number({ validate: { positive: true } }),
          description: s.string().optional(),
        },
      },
    });

    const menuSchema = s.object({
      validate: {
        properties: {
          restaurantName: s.string(),
          sections: s.record(s.string(), s.array(dishSchema)),
        },
      },
    });

    const validMenu = {
      restaurantName: "The Gourmet Place",
      sections: {
        Appetizers: [
          { name: "Bruschetta", price: 8.5 },
          { name: "Calamari", price: 12.0 },
        ],
        "Main Courses": [
          { name: "Steak Frites", price: 28.0 },
          {
            name: "Salmon",
            price: 24.5,
            description: "With a lemon dill sauce",
          },
        ],
      },
    };

    await expect(menuSchema.parse(validMenu)).resolves.toEqual(validMenu);

    const invalidMenu = {
      ...validMenu,
      sections: { Appetizers: [{ name: "Invalid Dish", price: -5 }] },
    };
    await expect(menuSchema.safeParse(invalidMenu)).resolves.toEqual(
      expect.objectContaining({ status: "error" })
    );
  });

  it("Scenario 18: Book Library Catalog", async () => {
    const bookSchema = s.object({
      validate: {
        properties: {
          isbn: s.string({
            validate: {
              pattern: /^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/,
            },
          }),
          title: s.string(),
          authors: s.array(s.string()),
          publisher: s.string(),
          publicationYear: s.number({ validate: { integer: true } }),
        },
      },
    });

    const validBook = {
      isbn: "978-0-321-76572-3",
      title: "The C++ Programming Language",
      authors: ["Bjarne Stroustrup"],
      publisher: "Addison-Wesley",
      publicationYear: 2013,
    };

    await expect(bookSchema.parse(validBook)).resolves.toEqual(validBook);

    const invalidBook = { ...validBook, isbn: "12345" };
    await expect(bookSchema.safeParse(invalidBook)).resolves.toEqual(
      expect.objectContaining({ status: "error" })
    );
  });

  it("Scenario 19: Smart Home Device State", async () => {
    const deviceStateSchema = s.switch({
      select: (ctx) => ctx.value.deviceType,
      cases: {
        light: s.object({
          validate: {
            properties: {
              deviceType: s.literal("light"),
              isOn: s.boolean(),
              brightness: s.number({ validate: { min: 0, max: 100 } }),
            },
          },
        }),
        thermostat: s.object({
          validate: {
            properties: {
              deviceType: s.literal("thermostat"),
              targetTemp: s.number(),
              currentTemp: s.number(),
            },
          },
        }),
        smart_plug: s.object({
          validate: {
            properties: {
              deviceType: s.literal("smart_plug"),
              isOn: s.boolean(),
              powerConsumption: s.number({ validate: { gte: 0 } }),
            },
          },
        }),
      },
    });

    const validLight = { deviceType: "light", isOn: true, brightness: 80 };
    await expect(deviceStateSchema.parse(validLight)).resolves.toEqual(
      validLight
    );

    const validThermostat = {
      deviceType: "thermostat",
      targetTemp: 22,
      currentTemp: 21.5,
    };
    await expect(deviceStateSchema.parse(validThermostat)).resolves.toEqual(
      validThermostat
    );

    const invalidDevice = { deviceType: "light", isOn: true, brightness: 110 };
    await expect(deviceStateSchema.safeParse(invalidDevice)).resolves.toEqual(
      expect.objectContaining({ status: "error" })
    );
  });

  it("Scenario 20: Recursive File System Tree", async () => {
    type File = {
      type: "file";
      name: string;
      size: number;
    };

    type Directory = {
      type: "directory";
      name: string;
      children: FileSystemEntry[];
    };

    type FileSystemEntry = File | Directory;

    const fileSchema = s.object({
      validate: {
        properties: {
          type: s.literal("file"),
          name: s.string(),
          size: s.number({ validate: { gte: 0 } }),
        },
      },
    });

    const directorySchema = s.object({
      validate: {
        properties: {
          type: s.literal("directory"),
          name: s.string(),
          get children() {
            return s.array(fileSystemEntrySchema);
          },
        },
      },
    });

    const fileSystemEntrySchema = s.switch({
      select: (ctx) => ctx.value.type,
      cases: {
        file: fileSchema,
        directory: directorySchema,
      },
      failOnNoMatch: true,
    });

    const validTree: Directory = {
      type: "directory",
      name: "root",
      children: [
        { type: "file", name: "file1.txt", size: 100 },
        {
          type: "directory",
          name: "subdir",
          children: [{ type: "file", name: "file2.txt", size: 200 }],
        },
      ],
    };

    await expect(fileSystemEntrySchema.parse(validTree)).resolves.toEqual(
      validTree
    );

    const invalidTree = {
      ...validTree,
      children: [{ type: "file", name: "invalid", size: -10 }],
    };
    await expect(fileSystemEntrySchema.safeParse(invalidTree)).resolves.toEqual(
      expect.objectContaining({ status: "error" })
    );

    const invalidTree2 = {
      type: "directory",
      name: "root",
      children: [{ type: "other", name: "invalid" }],
    };
    const result = await fileSystemEntrySchema.safeParse(invalidTree2);
    expect(result.status).toBe("error");
  });

  it("Scenario 21: Survey Responses", async () => {
    const surveyResponseSchema = s.object({
      validate: {
        properties: {
          surveyId: s.string(),
          responses: s.array(
            s.object({
              validate: {
                properties: {
                  questionId: s.string(),
                  answer: s.union({
                    validate: {
                      of: [
                        s.string(),
                        s.number(),
                        s.array(s.string()),
                        s.object({
                          validate: {
                            properties: {
                              lat: s.number(),
                              long: s.number(),
                            },
                          },
                        }),
                      ],
                    },
                  }),
                },
              },
            })
          ),
        },
      },
    });

    const validSurveyResponse = {
      surveyId: "survey123",
      responses: [
        { questionId: "q1", answer: "Answer 1" },
        { questionId: "q2", answer: 42 },
        { questionId: "q3", answer: ["Option 1", "Option 2"] },
        { questionId: "q4", answer: { lat: 40.7128, long: -74.006 } },
      ],
    };

    await expect(
      surveyResponseSchema.parse(validSurveyResponse)
    ).resolves.toEqual(validSurveyResponse);

    const invalidSurveyResponse = {
      ...validSurveyResponse,
      responses: [{ questionId: "q1", answer: { invalid: "answer" } }],
    };
    await expect(
      surveyResponseSchema.safeParse(invalidSurveyResponse)
    ).resolves.toEqual(expect.objectContaining({ status: "error" }));
  });
});
